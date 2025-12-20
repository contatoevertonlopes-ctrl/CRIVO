import * as XLSX from "xlsx";
import { 
  autoCategorize, 
  parseMonetaryValue, 
  parseDate, 
  generateTransactionId 
} from "./importUtils";
import type { ParsedTransaction } from "./TransactionPreviewTable";
import type { ColumnMapping } from "./ColumnMapper";

export interface RawData {
  headers: string[];
  data: string[][];
}

export const parseCSV = (content: string): RawData => {
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, "").trim();
  // Normalize line endings
  const normalizedContent = cleanContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedContent.split("\n").filter(line => line.trim());
  
  if (lines.length === 0) return { headers: [], data: [] };
  
  // Detect separator
  const firstLine = lines[0];
  let separator = ",";
  if (firstLine.includes(";")) separator = ";";
  else if (firstLine.includes("\t")) separator = "\t";
  
  const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ""));
  
  const data: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      data.push(parts);
    }
  }
  
  return { headers, data };
};

export const parseXLSX = async (file: File): Promise<RawData> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rawData: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  if (rawData.length === 0) return { headers: [], data: [] };
  
  const headers = (rawData[0] || []).map(h => String(h || "").trim());
  const data = rawData.slice(1).map(row => 
    (row || []).map(cell => String(cell ?? "").trim())
  ).filter(row => row.some(cell => cell.length > 0));
  
  return { headers, data };
};

export const parseOFX = (content: string): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];
  
  const cleanContent = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Try XML-style first
  let stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  let found = false;
  
  while ((match = stmtTrnRegex.exec(cleanContent)) !== null) {
    found = true;
    const transaction = parseOFXBlock(match[1]);
    if (transaction) transactions.push(transaction);
  }
  
  // If no matches, try SGML-style
  if (!found) {
    const blocks = cleanContent.split(/<STMTTRN>/i);
    
    for (let i = 1; i < blocks.length; i++) {
      let block = blocks[i];
      const endIndex = block.search(/<\/(STMTTRN|BANKTRANLIST|STMTRS|OFX)>/i);
      if (endIndex > 0) block = block.substring(0, endIndex);
      
      const transaction = parseOFXBlock(block);
      if (transaction) transactions.push(transaction);
    }
  }
  
  return transactions;
};

const parseOFXBlock = (block: string): ParsedTransaction | null => {
  const trnType = extractOFXField(block, "TRNTYPE");
  const datePosted = extractOFXField(block, "DTPOSTED");
  const amountStr = extractOFXField(block, "TRNAMT");
  const amount = parseMonetaryValue(amountStr);
  const memo = extractOFXField(block, "MEMO") || extractOFXField(block, "NAME") || "Transação importada";
  
  if (amount !== 0) {
    const description = memo.substring(0, 100).trim();
    const { category, suggested } = autoCategorize(description);
    const type = amount < 0 || trnType === "DEBIT" ? "expense" : "income";
    
    return {
      id: generateTransactionId(),
      date: parseOFXDate(datePosted),
      description,
      amount: Math.abs(amount),
      type,
      category,
      suggestedCategory: suggested ? category : undefined,
      selected: true,
    };
  }
  return null;
};

const extractOFXField = (block: string, field: string): string => {
  const regexWithClose = new RegExp(`<${field}>([^<]*)</${field}>`, "i");
  const regexNoClose = new RegExp(`<${field}>([^<\\n]+)`, "i");
  
  let match = block.match(regexWithClose);
  if (!match) match = block.match(regexNoClose);
  return match ? match[1].trim() : "";
};

const parseOFXDate = (dateStr: string): string => {
  if (dateStr.length >= 8) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split("T")[0];
};

export const applyMapping = (rawData: RawData, mapping: ColumnMapping): ParsedTransaction[] => {
  const { headers, data } = rawData;
  const transactions: ParsedTransaction[] = [];
  
  const dateIndex = headers.indexOf(mapping.date);
  const descriptionIndex = headers.indexOf(mapping.description);
  const amountIndex = mapping.amount ? headers.indexOf(mapping.amount) : -1;
  const creditIndex = mapping.credit ? headers.indexOf(mapping.credit) : -1;
  const debitIndex = mapping.debit ? headers.indexOf(mapping.debit) : -1;
  const categoryIndex = mapping.category ? headers.indexOf(mapping.category) : -1;

  const hasAmountColumn = amountIndex !== -1;
  const hasCreditDebitColumns = creditIndex !== -1 || debitIndex !== -1;
  
  if (dateIndex === -1 || descriptionIndex === -1 || (!hasAmountColumn && !hasCreditDebitColumns)) {
    return [];
  }

  for (const row of data) {
    const dateStr = row[dateIndex]?.trim();
    const description = row[descriptionIndex]?.trim();
    const existingCategory = categoryIndex >= 0 ? row[categoryIndex]?.trim() : "";
    
    let amount = 0;
    let type: "income" | "expense" = "expense";
    
    if (hasCreditDebitColumns) {
      const creditStr = creditIndex >= 0 ? row[creditIndex]?.trim() : "";
      const debitStr = debitIndex >= 0 ? row[debitIndex]?.trim() : "";
      
      const creditAmount = parseMonetaryValue(creditStr);
      const debitAmount = parseMonetaryValue(debitStr);
      
      if (creditAmount > 0) {
        amount = creditAmount;
        type = "income";
      } else if (debitAmount > 0) {
        amount = debitAmount;
        type = "expense";
      } else if (creditAmount < 0) {
        amount = Math.abs(creditAmount);
        type = "expense";
      } else if (debitAmount < 0) {
        amount = Math.abs(debitAmount);
        type = "income";
      }
    } else {
      const amountStr = row[amountIndex]?.trim();
      amount = parseMonetaryValue(amountStr);
      type = amount < 0 ? "expense" : "income";
      amount = Math.abs(amount);
    }
    
    if (amount > 0 && description) {
      const { category, suggested } = autoCategorize(description, existingCategory);
      
      transactions.push({
        id: generateTransactionId(),
        date: parseDate(dateStr),
        description: description.substring(0, 100),
        amount,
        type,
        category,
        suggestedCategory: suggested ? category : undefined,
        selected: true,
      });
    }
  }
  
  return transactions;
};

export const autoDetectMapping = (headers: string[]): ColumnMapping => {
  const creditCol = headers.find(h => /cr[eé]dito|credit|entrada|deposito/i.test(h)) || "";
  const debitCol = headers.find(h => /d[eé]bito|debit|sa[ií]da|retirada/i.test(h)) || "";
  
  return {
    date: headers.find(h => /data|date|dt|vencimento/i.test(h)) || "",
    description: headers.find(h => /descri|memo|hist|name|titulo|lan[cç]amento/i.test(h)) || "",
    amount: creditCol || debitCol ? "" : (headers.find(h => /valor|amount|value|quantia/i.test(h)) || ""),
    credit: creditCol,
    debit: debitCol,
    category: headers.find(h => /categ|tipo|type/i.test(h)) || "",
  };
};
