-- ═════════════════════════════════════════════════════
-- ROOTIO - Tabelas para Sincronização
-- Execute este script no SQL Editor do Supabase
-- ═════════════════════════════════════════════════════

-- 1. PROFILES (usuários)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  birthdate DATE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  points INTEGER DEFAULT 0,
  avatar TEXT DEFAULT '🌱',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABITS (hábitos)
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'PiStarBold',
  done BOOLEAN DEFAULT false,
  pts INTEGER DEFAULT 20,
  priority TEXT DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baixa')),
  freq TEXT DEFAULT 'diario',
  days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABIT_HISTORY (histórico diário)
CREATE TABLE IF NOT EXISTS habit_history (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  habits JSONB DEFAULT '{}',
  PRIMARY KEY (user_id, date)
);

-- 4. TRANSACTIONS (transações financeiras)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FINANCIAL_GOALS (metas financeiras)
CREATE TABLE IF NOT EXISTS financial_goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target DECIMAL(12,2) NOT NULL,
  current DECIMAL(12,2) DEFAULT 0,
  icon TEXT DEFAULT 'PiTargetBold',
  deadline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EMERGENCY_FUND (reserva de emergência)
CREATE TABLE IF NOT EXISTS emergency_fund (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target DECIMAL(12,2) DEFAULT 0,
  current DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FINANCE_CONFIG (configurações financeiras)
CREATE TABLE IF NOT EXISTS finance_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  income DECIMAL(12,2),
  month_goal DECIMAL(12,2),
  month_goal_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CAREER_READINGS (leituras de carreira)
CREATE TABLE IF NOT EXISTS career_readings (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'lendo', 'concluido')),
  notes TEXT,
  type TEXT,
  link TEXT,
  rating INTEGER,
  createdAt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CAREER_GOBS (metas de carreira)
CREATE TABLE IF NOT EXISTS career_goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  createdAt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CAREER_PROJECTS (projetos de carreira)
CREATE TABLE IF NOT EXISTS career_projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tech TEXT[],
  link TEXT,
  status TEXT DEFAULT 'planejando' CHECK (status IN ('planejando', 'em_andamento', 'concluido')),
  createdAt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. LIFE_PROJECTS (projetos de vida)
CREATE TABLE IF NOT EXISTS life_projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Pessoal',
  status TEXT DEFAULT 'planejando' CHECK (status IN ('planejando', 'andamento', 'concluido')),
  pinned BOOLEAN DEFAULT false,
  milestones JSONB DEFAULT '[]',
  createdAt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. JOURNAL (diário/reflexões)
CREATE TABLE IF NOT EXISTS journal (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  mood TEXT,
  tags TEXT[],
  date TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════
-- RLS - Row Level Security (proteção de dados)
-- ═════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só acessa seus próprios dados
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own habits" ON habits FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own history" ON habit_history FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own goals" ON financial_goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own emergency" ON emergency_fund FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own config" ON finance_config FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own readings" ON career_readings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own career goals" ON career_goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own career projects" ON career_projects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own life projects" ON life_projects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own journal" ON journal FOR ALL USING (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════
-- Trigger para criar perfil automaticamente
-- ═════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, plan, points, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'free',
    0,
    '🌱'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═════════════════════════════════════════════════════
-- Índice para performance
-- ═════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_date ON habit_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_goals_user ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_user ON career_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal(user_id, date);