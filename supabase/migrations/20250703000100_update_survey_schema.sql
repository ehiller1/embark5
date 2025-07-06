-- Drop existing tables if they exist (for clean migration)
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_survey_templates_updated_at ON public.survey_templates;
DROP TRIGGER IF EXISTS update_survey_responses_updated_at ON public.survey_responses;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS public.survey_responses;
DROP TABLE IF EXISTS public.user_surveys;
DROP TABLE IF EXISTS public.survey_templates;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.conversations;

-- Create updated conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    church_id UUID, -- Reference to the church this conversation belongs to
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated survey_templates table
CREATE TABLE public.survey_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    church_id UUID NOT NULL, -- Reference to the church this survey is for
    survey_type TEXT NOT NULL CHECK (survey_type IN ('parish', 'neighborhood')),
    template_data JSONB NOT NULL, -- Stores the OpenAI generated template
    is_active BOOLEAN DEFAULT true,
    public_url TEXT, -- For neighborhood surveys
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated survey_responses table
CREATE TABLE public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID NOT NULL, -- Denormalized for easier querying
    response_data JSONB NOT NULL, -- Stores text field responses
    conversation JSONB NOT NULL, -- Stores the conversation history
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_church_id_idx ON public.conversations(church_id);
CREATE INDEX IF NOT EXISTS survey_templates_church_id_idx ON public.survey_templates(church_id);
CREATE INDEX IF NOT EXISTS survey_templates_survey_type_idx ON public.survey_templates(survey_type);
CREATE INDEX IF NOT EXISTS survey_responses_survey_template_id_idx ON public.survey_responses(survey_template_id);
CREATE INDEX IF NOT EXISTS survey_responses_user_id_idx ON public.survey_responses(user_id);
CREATE INDEX IF NOT EXISTS survey_responses_church_id_idx ON public.survey_responses(church_id);

-- Create function to update updated_at timestamps
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

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
    ON public.conversations 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversations" 
    ON public.conversations 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Create RLS policies for survey_templates
CREATE POLICY "Enable read access for all authenticated users" 
    ON public.survey_templates 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their church's surveys" 
    ON public.survey_templates 
    FOR ALL 
    USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'church_id' = church_id::text
        )
    );

-- Create RLS policies for survey_responses
CREATE POLICY "Users can view their own responses" 
    ON public.survey_responses 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Church admins can view their church's responses" 
    ON public.survey_responses 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'church_id' = church_id::text
        )
    );

CREATE POLICY "Users can manage their own responses" 
    ON public.survey_responses 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Create a function to generate public URLs for surveys
CREATE OR REPLACE FUNCTION generate_survey_url()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.survey_type = 'neighborhood' AND NEW.public_url IS NULL THEN
        NEW.public_url := 'neighborhood/' || NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate public URLs for neighborhood surveys
CREATE TRIGGER generate_survey_url_trigger
BEFORE INSERT ON public.survey_templates
FOR EACH ROW
WHEN (NEW.survey_type = 'neighborhood')
EXECUTE FUNCTION generate_survey_url();
