-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
    ON public.conversations 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" 
    ON public.conversations 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
    ON public.conversations 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
    ON public.conversations 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "order" INTEGER NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own messages" 
    ON public.messages 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE public.conversations.id = conversation_id 
        AND public.conversations.user_id = auth.uid()
    ));

-- Create survey_templates table
CREATE TABLE IF NOT EXISTS public.survey_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for survey_templates
ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for survey_templates
CREATE POLICY "Enable read access for all users" 
    ON public.survey_templates 
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.survey_templates 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for template owners" 
    ON public.survey_templates 
    FOR UPDATE 
    USING (auth.uid() = created_by);

-- Create user_surveys table
CREATE TABLE IF NOT EXISTS public.user_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    survey_template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, survey_template_id)
);

-- Enable RLS for user_surveys
ALTER TABLE public.user_surveys ENABLE ROW LEVEL SECURITY;

-- Create policies for user_surveys
CREATE POLICY "Users can view their own surveys" 
    ON public.user_surveys 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own surveys" 
    ON public.user_surveys 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_survey_id UUID REFERENCES public.user_surveys(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, -- This will be a string identifier for the question
    response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_survey_id, question_id)
);

-- Enable RLS for survey_responses
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for survey_responses
CREATE POLICY "Users can view their own survey responses" 
    ON public.survey_responses 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.user_surveys 
        WHERE public.user_surveys.id = user_survey_id 
        AND public.user_surveys.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own survey responses" 
    ON public.survey_responses 
    FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.user_surveys 
        WHERE public.user_surveys.id = user_survey_id 
        AND public.user_surveys.user_id = auth.uid()
    ));

-- Create function to update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_templates_updated_at
BEFORE UPDATE ON public.survey_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at
BEFORE UPDATE ON public.survey_responses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_order_idx ON public.messages(conversation_id, "order");
CREATE INDEX IF NOT EXISTS survey_templates_created_by_idx ON public.survey_templates(created_by);
CREATE INDEX IF NOT EXISTS user_surveys_user_id_idx ON public.user_surveys(user_id);
CREATE INDEX IF NOT EXISTS user_surveys_survey_template_id_idx ON public.user_surveys(survey_template_id);
CREATE INDEX IF NOT EXISTS survey_responses_user_survey_id_idx ON public.survey_responses(user_survey_id);
