export type ArtDirectionKey = 'minimal' | 'editorial' | 'glass' | 'brutalist' | 'cinematic';
export type SurfaceKey = 'flat' | 'card' | 'glass' | 'frame';
export type TypographyKey = 'sm' | 'md' | 'lg' | 'xl';
export type RadiusKey = 'none' | 'sm' | 'md' | 'full';
export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'yes_no'
  | 'rating'
  | 'email'
  | 'phone'
  | 'date'
  | 'statement'
  | 'file_upload';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface QuestionLogic {
  condition?: string;
  value?: string;
  action?: 'jump' | 'end' | 'hide';
  target?: string;
}

export interface Question {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: QuestionOption[];
  logic?: QuestionLogic[];
  maxRating?: number;
  allowMultiple?: boolean;
}

export interface FormStyle {
  art_direction: ArtDirectionKey;
  surface: SurfaceKey;
  typography: TypographyKey;
  radius: RadiusKey;
  canvas?: {
    background?: string;
    pattern?: 'none' | 'dots' | 'grid';
  };
  custom_tokens?: Record<string, string>;
}

export interface Form {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  settings: {
    ending_type?: 'simple' | 'status' | 'redirect';
    ending_redirect_url?: string;
    ending_status_message?: string;
    collect_email?: boolean;
    show_progress?: boolean;
  };
  created_at: string;
  is_published?: boolean;
  question_count?: number;
  response_count?: number;
  style?: FormStyle;
}

export interface Response {
  id: string;
  form_id: string;
  started_at: string;
  completed_at?: string;
  metadata?: {
    user_agent?: string;
    referrer?: string;
    ip?: string;
  };
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  value: string;
  created_at: string;
}

export interface Issue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  action?: string;
  actionLabel?: string;
}

export interface BuilderState {
  formId: string;
  mode: 'build' | 'design' | 'preview';
  questions: Question[];
  selectedQuestionId: string | null;
  artDirection: ArtDirectionKey;
  surface: SurfaceKey;
  typography: TypographyKey;
  radius: RadiusKey;
  previewingDirection: ArtDirectionKey | null;
  isDirty: boolean;
  isSaving: boolean;
  issues: Issue[];
  formTitle: string;
  autoSetSurface: boolean;
  autoSetTypography: boolean;
  autoSetRadius: boolean;
}
