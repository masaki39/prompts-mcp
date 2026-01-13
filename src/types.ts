export type PromptDefinition = {
    generatedName: string;  // パスから自動生成（旧 'name'）
    description: string;    // frontmatterから読み込み
    prompt: string;         // マークダウン本文
    filePath: string;       // 絶対パス
    relativePath: string;   // PROMPTS_DIRからの相対パス
    enabled: boolean;       // デフォルト true
};

export type RegistrationMode = 'tool' | 'prompt' | 'both';

export type RegisterResult = {
    enabled: PromptDefinition[];
    disabled: PromptDefinition[];
};
