/**
 * VLD Documentation Website - Alpine.js Application
 */

function app() {
    return {
        // Theme
        darkMode: false,
        mobileMenu: false,

        // Package manager
        packageManager: 'npm',
        copied: false,

        // Documentation
        activeDocItem: 'string',
        openDocCategories: ['primitives'],
        docCategories: [
            {
                id: 'primitives',
                name: 'Primitives',
                items: [
                    { id: 'string', name: 'v.string()' },
                    { id: 'number', name: 'v.number()' },
                    { id: 'boolean', name: 'v.boolean()' },
                    { id: 'date', name: 'v.date()' },
                    { id: 'bigint', name: 'v.bigint()' },
                    { id: 'symbol', name: 'v.symbol()' }
                ]
            },
            {
                id: 'collections',
                name: 'Collections',
                items: [
                    { id: 'array', name: 'v.array()' },
                    { id: 'tuple', name: 'v.tuple()' },
                    { id: 'set', name: 'v.set()' },
                    { id: 'map', name: 'v.map()' },
                    { id: 'record', name: 'v.record()' }
                ]
            },
            {
                id: 'objects',
                name: 'Objects & Composition',
                items: [
                    { id: 'object', name: 'v.object()' },
                    { id: 'union', name: 'v.union()' },
                    { id: 'intersection', name: 'v.intersection()' },
                    { id: 'literal', name: 'v.literal()' },
                    { id: 'enum', name: 'v.enum()' }
                ]
            },
            {
                id: 'modifiers',
                name: 'Type Modifiers',
                items: [
                    { id: 'optional', name: 'v.optional()' },
                    { id: 'nullable', name: 'v.nullable()' },
                    { id: 'nullish', name: 'v.nullish()' },
                    { id: 'default', name: '.default()' },
                    { id: 'catch', name: '.catch()' }
                ]
            },
            {
                id: 'coercion',
                name: 'Coercion',
                items: [
                    { id: 'coerce-string', name: 'v.coerce.string()' },
                    { id: 'coerce-number', name: 'v.coerce.number()' },
                    { id: 'coerce-boolean', name: 'v.coerce.boolean()' },
                    { id: 'coerce-date', name: 'v.coerce.date()' },
                    { id: 'coerce-bigint', name: 'v.coerce.bigint()' }
                ]
            },
            {
                id: 'codecs',
                name: 'Codecs',
                items: [
                    { id: 'stringToNumber', name: 'stringToNumber' },
                    { id: 'isoDatetimeToDate', name: 'isoDatetimeToDate' },
                    { id: 'jsonCodec', name: 'jsonCodec' },
                    { id: 'base64ToBytes', name: 'base64ToBytes' },
                    { id: 'jwtPayload', name: 'jwtPayload' }
                ]
            },
            {
                id: 'errors',
                name: 'Error Handling',
                items: [
                    { id: 'parse', name: 'parse()' },
                    { id: 'safeParse', name: 'safeParse()' },
                    { id: 'treeifyError', name: 'treeifyError()' },
                    { id: 'prettifyError', name: 'prettifyError()' },
                    { id: 'flattenError', name: 'flattenError()' }
                ]
            },
            {
                id: 'advanced',
                name: 'Advanced',
                items: [
                    { id: 'refine', name: '.refine()' },
                    { id: 'transform', name: '.transform()' },
                    { id: 'pick', name: '.pick()' },
                    { id: 'omit', name: '.omit()' },
                    { id: 'extend', name: '.extend()' }
                ]
            }
        ],

        // Examples
        exampleCategory: 'all',

        // Playground
        playgroundTemplate: 'basic',
        playgroundEditor: null,
        playgroundOutput: '',
        playgroundResult: null,
        playgroundTemplates: {
            basic: `// Basic string validation
const schema = v.string().email();

const data = "user@example.com";

// Validate
const result = schema.safeParse(data);
console.log(result);`,
            form: `// User registration form validation
const registerSchema = v.object({
    username: v.string()
        .min(3, 'Username too short')
        .max(20, 'Username too long'),
    email: v.string().email('Invalid email'),
    password: v.string()
        .min(8, 'Password must be 8+ characters'),
    age: v.number().min(18).optional()
});

const data = {
    username: "john_doe",
    email: "john@example.com",
    password: "securePass123",
    age: 25
};

const result = registerSchema.safeParse(data);
console.log(result);`,
            api: `// API response schema
const apiSchema = v.object({
    success: v.boolean(),
    data: v.object({
        id: v.string().uuid(),
        name: v.string(),
        email: v.string().email(),
        role: v.enum('admin', 'user', 'guest')
    }),
    timestamp: v.coerce.date()
});

const data = {
    success: true,
    data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Alice",
        email: "alice@example.com",
        role: "admin"
    },
    timestamp: "2024-01-15T10:30:00Z"
};

const result = apiSchema.safeParse(data);
console.log(result);`,
            coercion: `// Type coercion examples
const schema = v.object({
    count: v.coerce.number(),
    active: v.coerce.boolean(),
    created: v.coerce.date()
});

// Input with string values (from form/API)
const data = {
    count: "42",
    active: "true",
    created: "2024-01-15"
};

const result = schema.safeParse(data);
console.log(result);
// count: 42 (number)
// active: true (boolean)
// created: Date object`,
            codecs: `// Bidirectional codec example
// Note: Codecs need to be imported

const schema = v.object({
    name: v.string(),
    age: v.number()
});

// Simulating JSON codec behavior
const jsonString = '{"name":"John","age":30}';
const parsed = JSON.parse(jsonString);

const result = schema.safeParse(parsed);
console.log(result);

// Encode back
if (result.success) {
    const encoded = JSON.stringify(result.data);
    console.log('Encoded:', encoded);
}`
        },

        // Benchmarks
        benchmarks: [
            { name: 'Simple String', vld: 44400000, zod: 26500000, ratio: 1.67, max: 44400000 },
            { name: 'Email Validation', vld: 18600000, zod: 5120000, ratio: 3.63, max: 18600000 },
            { name: 'Number Validation', vld: 22700000, zod: 8660000, ratio: 2.62, max: 22700000 },
            { name: 'Object Validation', vld: 7600000, zod: 5980000, ratio: 1.27, max: 7600000 },
            { name: 'Array Validation', vld: 6700000, zod: 5190000, ratio: 1.29, max: 6700000 },
            { name: 'Union Types', vld: 6800000, zod: 4420000, ratio: 1.54, max: 6800000 }
        ],

        // i18n
        selectedLocale: 'en',
        languages: [
            { code: 'en', flag: '🇬🇧', name: 'English' },
            { code: 'tr', flag: '🇹🇷', name: 'Turkish' },
            { code: 'es', flag: '🇪🇸', name: 'Spanish' },
            { code: 'fr', flag: '🇫🇷', name: 'French' },
            { code: 'de', flag: '🇩🇪', name: 'German' },
            { code: 'it', flag: '🇮🇹', name: 'Italian' },
            { code: 'pt', flag: '🇵🇹', name: 'Portuguese' },
            { code: 'ru', flag: '🇷🇺', name: 'Russian' },
            { code: 'ja', flag: '🇯🇵', name: 'Japanese' },
            { code: 'ko', flag: '🇰🇷', name: 'Korean' },
            { code: 'zh', flag: '🇨🇳', name: 'Chinese' },
            { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
            { code: 'hi', flag: '🇮🇳', name: 'Hindi' },
            { code: 'nl', flag: '🇳🇱', name: 'Dutch' },
            { code: 'pl', flag: '🇵🇱', name: 'Polish' },
            { code: 'da', flag: '🇩🇰', name: 'Danish' },
            { code: 'sv', flag: '🇸🇪', name: 'Swedish' },
            { code: 'no', flag: '🇳🇴', name: 'Norwegian' },
            { code: 'fi', flag: '🇫🇮', name: 'Finnish' },
            { code: 'th', flag: '🇹🇭', name: 'Thai' },
            { code: 'vi', flag: '🇻🇳', name: 'Vietnamese' },
            { code: 'id', flag: '🇮🇩', name: 'Indonesian' },
            { code: 'bn', flag: '🇧🇩', name: 'Bengali' },
            { code: 'sw', flag: '🇰🇪', name: 'Swahili' }
        ],
        localeDemo: {
            email: 'invalid-email',
            emailError: '',
            minLength: 'Hi',
            minLengthError: ''
        },
        localeMessages: {
            en: { email: 'Invalid email format', minLength: 'String must be at least 5 characters' },
            tr: { email: 'Geçersiz e-posta formatı', minLength: 'Metin en az 5 karakter olmalı' },
            es: { email: 'Formato de correo electrónico inválido', minLength: 'La cadena debe tener al menos 5 caracteres' },
            fr: { email: 'Format d\'email invalide', minLength: 'La chaîne doit comporter au moins 5 caractères' },
            de: { email: 'Ungültiges E-Mail-Format', minLength: 'Die Zeichenkette muss mindestens 5 Zeichen haben' },
            it: { email: 'Formato email non valido', minLength: 'La stringa deve contenere almeno 5 caratteri' },
            pt: { email: 'Formato de e-mail inválido', minLength: 'A string deve ter pelo menos 5 caracteres' },
            ru: { email: 'Неверный формат email', minLength: 'Строка должна содержать не менее 5 символов' },
            ja: { email: '無効なメール形式', minLength: '文字列は5文字以上である必要があります' },
            ko: { email: '유효하지 않은 이메일 형식', minLength: '문자열은 5자 이상이어야 합니다' },
            zh: { email: '无效的电子邮件格式', minLength: '字符串必须至少包含5个字符' },
            ar: { email: 'تنسيق البريد الإلكتروني غير صالح', minLength: 'يجب أن تتكون السلسلة من 5 أحرف على الأقل' },
            hi: { email: 'अमान्य ईमेल प्रारूप', minLength: 'स्ट्रिंग कम से कम 5 वर्णों की होनी चाहिए' },
            nl: { email: 'Ongeldig e-mailformaat', minLength: 'String moet minimaal 5 tekens bevatten' },
            pl: { email: 'Nieprawidłowy format e-mail', minLength: 'Ciąg znaków musi mieć co najmniej 5 znaków' },
            da: { email: 'Ugyldigt e-mail-format', minLength: 'Strengen skal indeholde mindst 5 tegn' },
            sv: { email: 'Ogiltigt e-postformat', minLength: 'Strängen måste innehålla minst 5 tecken' },
            no: { email: 'Ugyldig e-postformat', minLength: 'Strengen må inneholde minst 5 tegn' },
            fi: { email: 'Virheellinen sähköpostimuoto', minLength: 'Merkkijonon on oltava vähintään 5 merkkiä' },
            th: { email: 'รูปแบบอีเมลไม่ถูกต้อง', minLength: 'สตริงต้องมีอักขระอย่างน้อย 5 ตัว' },
            vi: { email: 'Định dạng email không hợp lệ', minLength: 'Chuỗi phải có ít nhất 5 ký tự' },
            id: { email: 'Format email tidak valid', minLength: 'String harus memiliki setidaknya 5 karakter' },
            bn: { email: 'অবৈধ ইমেল ফরম্যাট', minLength: 'স্ট্রিং কমপক্ষে 5 অক্ষরের হতে হবে' },
            sw: { email: 'Muundo wa barua pepe si sahihi', minLength: 'Kamba lazima iwe na angalau herufi 5' }
        },

        // Initialize
        init() {
            // Load theme from localStorage
            this.darkMode = localStorage.getItem('vld-theme') === 'dark' ||
                (!localStorage.getItem('vld-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            this.applyTheme();

            // Initialize playground
            this.$nextTick(() => {
                this.initPlayground();
                this.updateLocaleDemo();
            });

            // Syntax highlight
            if (typeof Prism !== 'undefined') {
                Prism.highlightAll();
            }
        },

        // Theme
        toggleTheme() {
            this.darkMode = !this.darkMode;
            this.applyTheme();
            localStorage.setItem('vld-theme', this.darkMode ? 'dark' : 'light');
        },

        applyTheme() {
            document.documentElement.classList.toggle('dark', this.darkMode);
        },

        // Install commands
        getInstallCommand() {
            const commands = {
                npm: 'npm install @oxog/vld',
                yarn: 'yarn add @oxog/vld',
                pnpm: 'pnpm add @oxog/vld'
            };
            return commands[this.packageManager];
        },

        async copyInstallCommand() {
            try {
                await navigator.clipboard.writeText(this.getInstallCommand());
                this.copied = true;
                setTimeout(() => this.copied = false, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        },

        // Documentation
        toggleDocCategory(categoryId) {
            const index = this.openDocCategories.indexOf(categoryId);
            if (index === -1) {
                this.openDocCategories.push(categoryId);
            } else {
                this.openDocCategories.splice(index, 1);
            }
        },

        // Playground
        initPlayground() {
            const editorElement = document.getElementById('playground-editor');
            if (!editorElement || typeof require === 'undefined') {
                // Monaco not loaded yet, try again
                setTimeout(() => this.initPlayground(), 500);
                return;
            }

            require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});

            require(['vs/editor/editor.main'], () => {
                // Set theme based on current mode
                monaco.editor.defineTheme('vld-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#18181b'
                    }
                });

                monaco.editor.defineTheme('vld-light', {
                    base: 'vs',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#ffffff'
                    }
                });

                this.playgroundEditor = monaco.editor.create(editorElement, {
                    value: this.playgroundTemplates.basic,
                    language: 'javascript',
                    theme: this.darkMode ? 'vld-dark' : 'vld-light',
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 }
                });

                // Watch for theme changes
                this.$watch('darkMode', (value) => {
                    if (this.playgroundEditor) {
                        monaco.editor.setTheme(value ? 'vld-dark' : 'vld-light');
                    }
                });
            });
        },

        loadPlaygroundTemplate() {
            if (this.playgroundEditor) {
                this.playgroundEditor.setValue(this.playgroundTemplates[this.playgroundTemplate] || '');
                this.playgroundOutput = '';
                this.playgroundResult = null;
            }
        },

        runPlayground() {
            if (!this.playgroundEditor) return;

            const code = this.playgroundEditor.getValue();
            let output = [];

            try {
                // Create a mock 'v' object for demonstration
                const mockV = this.createMockValidator();

                // Capture console.log
                const originalLog = console.log;
                console.log = (...args) => {
                    output.push(args.map(arg =>
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '));
                };

                // Execute code
                const fn = new Function('v', code);
                fn(mockV);

                console.log = originalLog;

                this.playgroundOutput = output.join('\n') || 'Code executed successfully (no output)';
                this.playgroundResult = { success: true };
            } catch (error) {
                this.playgroundOutput = `Error: ${error.message}`;
                this.playgroundResult = { success: false };
            }
        },

        createMockValidator() {
            // Create a simplified mock validator for playground demo
            const createChain = () => {
                const chain = {
                    min: () => chain,
                    max: () => chain,
                    email: () => chain,
                    url: () => chain,
                    uuid: () => chain,
                    regex: () => chain,
                    trim: () => chain,
                    toLowerCase: () => chain,
                    toUpperCase: () => chain,
                    int: () => chain,
                    positive: () => chain,
                    negative: () => chain,
                    nonnegative: () => chain,
                    optional: () => chain,
                    nullable: () => chain,
                    default: () => chain,
                    refine: () => chain,
                    transform: () => chain,
                    parse: (val) => val,
                    safeParse: (val) => ({ success: true, data: val })
                };
                return chain;
            };

            const createObjectChain = (shape) => {
                const chain = {
                    strict: () => chain,
                    passthrough: () => chain,
                    partial: () => chain,
                    pick: () => chain,
                    omit: () => chain,
                    extend: () => chain,
                    parse: (val) => val,
                    safeParse: (val) => {
                        // Basic validation
                        if (typeof val !== 'object' || val === null) {
                            return { success: false, error: { message: 'Expected object' } };
                        }
                        return { success: true, data: val };
                    }
                };
                return chain;
            };

            return {
                string: () => createChain(),
                number: () => createChain(),
                boolean: () => createChain(),
                date: () => createChain(),
                bigint: () => createChain(),
                symbol: () => createChain(),
                array: () => createChain(),
                object: (shape) => createObjectChain(shape),
                union: (...args) => createChain(),
                literal: (val) => createChain(),
                enum: (...vals) => createChain(),
                optional: (schema) => schema,
                nullable: (schema) => schema,
                coerce: {
                    string: () => createChain(),
                    number: () => createChain(),
                    boolean: () => createChain(),
                    date: () => createChain(),
                    bigint: () => createChain()
                }
            };
        },

        async sharePlayground() {
            if (!this.playgroundEditor) return;

            const code = this.playgroundEditor.getValue();
            const compressed = LZString.compressToEncodedURIComponent(code);
            const url = `${window.location.origin}${window.location.pathname}?code=${compressed}#playground`;

            try {
                await navigator.clipboard.writeText(url);
                alert('Playground URL copied to clipboard!');
            } catch (err) {
                console.error('Copy failed:', err);
            }
        },

        // Performance
        formatOps(ops) {
            if (ops >= 1000000) {
                return (ops / 1000000).toFixed(1) + 'M ops/sec';
            }
            return (ops / 1000).toFixed(0) + 'K ops/sec';
        },

        // i18n Demo
        updateLocaleDemo() {
            const messages = this.localeMessages[this.selectedLocale] || this.localeMessages.en;

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            this.localeDemo.emailError = emailRegex.test(this.localeDemo.email) ? '' : messages.email;

            // Min length validation
            this.localeDemo.minLengthError = this.localeDemo.minLength.length >= 5 ? '' : messages.minLength;
        }
    };
}

// Load code from URL if present
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(code);
            if (decompressed) {
                // Store for later use when editor initializes
                window.initialPlaygroundCode = decompressed;
            }
        } catch (e) {
            console.error('Failed to decompress code:', e);
        }
    }
});
