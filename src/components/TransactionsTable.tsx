const transactions = [
  {
    date: "24/11/2025",
    description: "Gestão de Tráfego – Cliente A",
    category: "Serviços",
    type: "income",
    value: "R$ 4.500,00",
    status: "confirmed",
  },
  {
    date: "22/11/2025",
    description: "Assinaturas de ferramentas",
    category: "Operacional",
    type: "expense",
    value: "R$ 690,00",
    status: "paid",
  },
  {
    date: "20/11/2025",
    description: "Campanhas Meta Ads",
    category: "Mídia paga",
    type: "expense",
    value: "R$ 2.300,00",
    status: "pending",
  },
  {
    date: "18/11/2025",
    description: "Gestão de Tráfego – Cliente B",
    category: "Serviços",
    type: "income",
    value: "R$ 3.200,00",
    status: "confirmed",
  },
  {
    date: "15/11/2025",
    description: "Internet & Infraestrutura",
    category: "Operacional",
    type: "expense",
    value: "R$ 280,00",
    status: "paid",
  },
];

const TransactionsTable = () => {
  return (
    <div className="rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-5">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-medium mb-0.5">Últimas transações</h3>
          <p className="text-[11px] text-muted-foreground">
            Resumo das entradas, saídas e recorrências mais recentes.
          </p>
        </div>
        <button className="text-[13px] px-3 py-2 rounded-full border border-border/50 bg-secondary/60 text-muted-foreground hover:border-border hover:text-foreground transition-all">
          Filtrar período
        </button>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-muted-foreground border-b border-secondary">
              <th className="text-left py-2 px-2 font-normal">Data</th>
              <th className="text-left py-2 px-2 font-normal">Descrição</th>
              <th className="text-left py-2 px-2 font-normal">Categoria</th>
              <th className="text-left py-2 px-2 font-normal">Tipo</th>
              <th className="text-left py-2 px-2 font-normal">Valor</th>
              <th className="text-left py-2 px-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr
                key={index}
                className="border-b border-secondary/90 hover:bg-secondary/80 transition-colors"
              >
                <td className="py-2 px-2">{transaction.date}</td>
                <td className="py-2 px-2">{transaction.description}</td>
                <td className="py-2 px-2">{transaction.category}</td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full ${
                      transaction.type === "income"
                        ? "bg-primary/14 text-green-200"
                        : "bg-destructive/10 text-red-200"
                    }`}
                  >
                    {transaction.type === "income" ? "Entrada" : "Saída"}
                  </span>
                </td>
                <td className="py-2 px-2">{transaction.value}</td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full ${
                      transaction.status === "confirmed" || transaction.status === "paid"
                        ? "bg-primary/14 text-green-200"
                        : "bg-warning/10 text-yellow-200"
                    }`}
                  >
                    {transaction.status === "confirmed"
                      ? "Confirmado"
                      : transaction.status === "paid"
                      ? "Pago"
                      : "Em aberto"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
