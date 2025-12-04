import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import MetricCard from "@/components/MetricCard";
import CashflowChart from "@/components/CashflowChart";
import ExpenseChart from "@/components/ExpenseChart";
import PlansCard from "@/components/PlansCard";
import TransactionsTable from "@/components/TransactionsTable";

const Index = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-5 lg:p-6 flex flex-col gap-5 min-w-0">
        <DashboardHeader />
        
        {/* Summary Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Saldo atual"
            value="R$ 18.940,27"
            pill="Conta consolidada"
            trend="+12,4% vs mês passado"
            trendUp={true}
          />
          <MetricCard
            title="Entradas no mês"
            value="R$ 32.500,00"
            pill="Receitas"
            trend="+8,1% vs. média"
            trendUp={true}
          />
          <MetricCard
            title="Saídas no mês"
            value="R$ 14.380,73"
            pill="Despesas"
            trend="-5,6% vs. mês passado"
            trendUp={false}
          />
          <MetricCard
            title="Compromissos futuros"
            value="R$ 7.290,00"
            pill="Próximos 30 dias"
            trend="4 despesas recorrentes agendadas"
            trendUp={false}
          />
        </section>

        {/* Charts & Plans */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.7fr_1.3fr] gap-5">
          <CashflowChart />
          
          <div className="flex flex-col gap-5">
            <ExpenseChart />
            <PlansCard />
          </div>
        </section>

        {/* Transactions Table */}
        <section>
          <TransactionsTable />
        </section>
      </main>
    </div>
  );
};

export default Index;
