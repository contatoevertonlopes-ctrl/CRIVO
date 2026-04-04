import { useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import Landing from "@/pages/Landing";

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return user ? <Index /> : <Landing />;
};

export default Home;
