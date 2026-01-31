<template>
  <v-main
    role="main"
    :class="isDark ? 'gradient-bg' : 'gradient-bg-light'"
  >
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <v-container
      id="main-content"
      class="max-w-5xl mx-auto pa-4 pa-sm-6 pa-md-8 fade-in"
      tabindex="-1"
    >
      <!-- Top navigation with reset and theme controls -->
      <nav class="d-flex justify-space-between align-center py-4 mb-6">
        <ResetButton
          :is-dark="isDark"
          aria-label="Reset options"
          @reset="resetOptions"
        />
        <div class="modern-badge">
          <span class="text-primary font-weight-bold">v1.0</span>
        </div>
        <ThemeToggle :is-dark="isDark" @toggle="toggleTheme" />
      </nav>

      <!-- Toast notification -->
      <Toast
        :message="'Options have been reset'"
        :show="showResetToast"
        :is-dark="isDark"
      />

      <!-- Screen reader announcement for loading state -->
      <div
        class="sr-only"
        aria-live="polite"
        aria-busy="isLoading"
        :aria-hidden="!isLoading && !generatedText"
      >
        {{ isLoading ? 'Generating content...' : generatedText ? 'Content ready.' : '' }}
      </div>

      <!-- Hero section -->
      <header role="banner" class="mb-10 mb-md-12">
        <v-card
          class="hero-gradient rounded-xl pa-8 pa-sm-10 pa-md-12 text-center position-relative overflow-hidden"
          elevation="0"
        >
          <div class="position-relative" style="z-index: 1;">
            <div class="mb-4">
              <v-icon
                size="48"
                color="white"
                class="float-icon opacity-90"
                aria-hidden="true"
              >
                mdi-text-box-multiple-outline
              </v-icon>
            </div>
            <h1
              class="text-h4 text-sm-h3 text-md-h2 font-weight-bold mb-4 mx-auto text-white"
              style="letter-spacing: -0.03em; line-height: 1.1;"
            >
              Ipsumify
            </h1>
            <p
              class="text-body-1 text-sm-h6 font-weight-regular max-w-xl mx-auto text-white opacity-90"
              style="line-height: 1.5;"
            >
              Generate beautiful, structured placeholder text in markdown format
            </p>
          </div>
        </v-card>
      </header>

      <!-- Options Section -->
      <section class="mb-8 mb-md-10">
        <div class="options-grid">
          <!-- Basic Options -->
          <v-card
            :class="[
              'rounded-xl pa-5 pa-sm-6 glow-border interactive-scale',
              isDark ? 'glass-card' : 'glass-card-light'
            ]"
            elevation="0"
          >
            <div class="d-flex align-center mb-5">
              <v-icon
                :color="isDark ? 'accent' : 'primary'"
                class="mr-3"
                aria-hidden="true"
              >
                mdi-tune-variant
              </v-icon>
              <h2 class="text-h6 font-weight-bold text-on-surface">
                Basic Options
              </h2>
            </div>
            <div class="d-flex flex-column ga-2">
              <v-checkbox
                v-for="[key, label] in basicOptions"
                :key="key"
                v-model="options[key]"
                :label="label"
                hide-details
                density="comfortable"
                color="primary"
                class="modern-checkbox"
              />
            </div>
          </v-card>

          <!-- Style Options -->
          <v-card
            :class="[
              'rounded-xl pa-5 pa-sm-6 glow-border interactive-scale',
              isDark ? 'glass-card' : 'glass-card-light'
            ]"
            elevation="0"
          >
            <div class="d-flex align-center mb-5">
              <v-icon
                :color="isDark ? 'accent' : 'primary'"
                class="mr-3"
                aria-hidden="true"
              >
                mdi-palette-outline
              </v-icon>
              <h2 class="text-h6 font-weight-bold text-on-surface">
                Style Options
              </h2>
            </div>
            <div class="d-flex flex-column ga-2">
              <v-checkbox
                v-for="[key, label] in styleOptions"
                :key="key"
                v-model="options[key]"
                :label="label"
                hide-details
                density="comfortable"
                color="primary"
                class="modern-checkbox"
              />
              <div class="mt-5 pt-4" style="border-top: 1px solid rgba(255,255,255,0.08);">
                  <v-text-field
                    v-model.number="options.numBlocks"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                    label="Number of blocks"
                    hint="Enter a value between 1 and 10"
                    persistent-hint
                    min="1"
                    max="10"
                    class="modern-input"
                    style="max-width: 160px"
                  />
                </div>
              </div>
            </v-card>
        </div>
      </section>

      <!-- Generate Button -->
      <section class="mb-8 mb-md-10">
        <v-btn
          @click="generateMarkdown"
          :disabled="isLoading"
          :loading="isLoading"
          size="x-large"
          block
          class="btn-gradient rounded-xl py-4"
          height="64"
          :aria-busy="isLoading"
        >
          <v-icon start size="24" aria-hidden="true" class="mr-2">
            {{ isLoading ? 'mdi-loading' : 'mdi-auto-fix' }}
          </v-icon>
          <span class="text-h6 font-weight-bold" style="letter-spacing: 0.02em;">
            {{ isLoading ? "Generating..." : "Generate Markdown" }}
          </span>
        </v-btn>
      </section>

      <!-- Loading State -->
      <section
        v-if="isLoading"
        class="mb-8"
        aria-hidden="true"
      >
        <v-card
          :class="['rounded-xl pa-8', isDark ? 'glass-card' : 'glass-card-light']"
          elevation="0"
        >
          <div class="skeleton-shimmer rounded-lg mb-4" style="height: 24px; width: 60%;"></div>
          <div class="skeleton-shimmer rounded-lg mb-3" style="height: 16px; width: 100%;"></div>
          <div class="skeleton-shimmer rounded-lg mb-3" style="height: 16px; width: 90%;"></div>
          <div class="skeleton-shimmer rounded-lg mb-3" style="height: 16px; width: 95%;"></div>
          <div class="skeleton-shimmer rounded-lg" style="height: 16px; width: 75%;"></div>
        </v-card>
      </section>

      <!-- Generated Content -->
      <section v-if="!isLoading && generatedText" class="mb-8 fade-in">
        <!-- Action buttons -->
        <div class="d-flex flex-column flex-sm-row justify-space-between align-stretch align-sm-center ga-3 mb-5">
          <v-btn
            @click="copyToClipboard"
            :color="copySuccess ? 'success' : undefined"
            :class="[
              'rounded-xl px-6',
              copySuccess ? '' : (isDark ? 'btn-secondary' : 'btn-secondary-light')
            ]"
            size="large"
            :variant="copySuccess ? 'flat' : 'outlined'"
          >
            <v-icon start aria-hidden="true">
              {{ copySuccess ? 'mdi-check-circle' : 'mdi-content-copy' }}
            </v-icon>
            {{ copySuccess ? "Copied!" : "Copy to Clipboard" }}
          </v-btn>
          <div class="d-flex ga-2 flex-wrap">
            <v-btn
              v-for="ext in ['.md', '.txt', '.html']"
              :key="ext"
              @click="downloadFile(ext)"
              :class="['rounded-xl', isDark ? 'btn-secondary' : 'btn-secondary-light']"
              variant="outlined"
              :aria-label="`Download as ${ext} file`"
            >
              <v-icon start size="18" aria-hidden="true">mdi-download</v-icon>
              {{ ext }}
            </v-btn>
          </div>
        </div>

        <!-- Output card -->
        <v-card
          :class="[
            'rounded-xl pa-5 pa-sm-6',
            isDark ? 'code-output' : 'code-output-light'
          ]"
          elevation="0"
        >
          <div class="d-flex align-center justify-space-between mb-4 pb-3" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div class="d-flex align-center">
              <v-icon size="18" class="mr-2 opacity-60" aria-hidden="true">mdi-code-braces</v-icon>
              <span class="text-caption text-uppercase font-weight-bold opacity-60" style="letter-spacing: 0.1em;">
                Generated Output
              </span>
            </div>
            <span class="text-caption opacity-50">
              {{ generatedText.length }} characters
            </span>
          </div>
          <pre
            :class="[
              options.noWrapping ? 'overflow-x-auto' : 'whitespace-pre-wrap',
              'text-body-2 ma-0'
            ]"
            style="line-height: 1.7; font-family: 'JetBrains Mono', 'Fira Code', monospace;"
          ><template v-if="options.noWrapping"><span v-html="formatNoWrap(generatedText)"></span></template><template v-else>{{ generatedText }}</template></pre>
        </v-card>
      </section>

      <!-- Footer -->
      <footer
        role="contentinfo"
        class="mt-12 mt-md-16 pt-8 text-center"
        :style="{
          borderTop: isDark
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid rgba(0,0,0,0.06)'
        }"
      >
        <div class="d-flex justify-center align-center ga-6 flex-wrap mb-4">
          <a
            href="https://github.com/ICJIA/ipsumify-2025"
            target="_blank"
            rel="noopener noreferrer"
            :class="[
              'text-decoration-none d-inline-flex align-center pa-2 rounded-lg footer-link',
              isDark ? 'text-on-surface' : 'text-on-surface'
            ]"
          >
            <v-icon class="mr-2" size="20" aria-hidden="true">mdi-github</v-icon>
            <span class="font-weight-medium">GitHub</span>
          </a>
          <a
            href="/documentation/accessibility/index.html"
            :class="[
              'text-decoration-none d-inline-flex align-center pa-2 rounded-lg footer-link',
              isDark ? 'text-on-surface' : 'text-on-surface'
            ]"
          >
            <v-icon class="mr-2" size="20" aria-hidden="true">mdi-shield-check</v-icon>
            <span class="font-weight-medium">Accessibility</span>
          </a>
        </div>
        <p class="text-caption opacity-50 mb-0">
          Built with Nuxt, Vuetify, and care for accessibility
        </p>
      </footer>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useTheme } from "vuetify";

const theme = useTheme();
const isDark = computed(() => theme.current.value.dark);

// Code examples
const codeExamples = [
  {
    lang: "javascript",
    code: `function processData(input) {
  return input.map(x => x * 2)
    .filter(x => x > 10);
}`,
  },
  {
    lang: "bash",
    code: `#!/bin/bash
for i in {1..5}
do
  echo "Processing $i..."
  sleep 1
done`,
  },
  {
    lang: "python",
    code: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
  },
  {
    lang: "sql",
    code: `SELECT category, COUNT(*) as total
FROM products
GROUP BY category
HAVING total > 100;`,
  },
];

// Latin words
const latinWords = [
  "Aether", "Bellum", "Carmen", "Deus", "Enim", "Fatum", "Gloria", "Homo",
  "Idem", "Jugum", "Lumen", "Mare", "Nox", "Opus", "Pax", "Quam", "Rex",
  "Sol", "Tempus", "Umbra", "Vita", "Vox", "Terra", "Sanctum", "Virtus",
  "Manus", "Caelum", "Anima", "Stella", "Ventus", "Magnus", "Patria",
  "Fortis", "Sapiens", "Veritas", "Natura", "Vis", "Lex", "Fides", "Amor",
  "Mors", "Pater", "Mater", "Filius", "Roma", "Diem", "Numen", "Corpus",
  "Annus", "Ignis", "Aqua", "Arbor", "Mons",
];

// State
const isLoading = ref(false);
const generatedText = ref("");
const copySuccess = ref(false);
const showResetToast = ref(false);

const options = ref({
  noHeaders: false,
  noCodeSnippets: false,
  noInlineMarkup: false,
  noBlockquotes: false,
  noLists: false,
  noExternalLinks: false,
  noWrapping: false,
  capitalizeSentences: false,
  underlinedHeaders: false,
  referenceLinks: false,
  emStyle: false,
  strongStyle: false,
  codeBlocks: false,
  numBlocks: 10,
});

const basicOptions = [
  ["noHeaders", "No headers"],
  ["noCodeSnippets", "No code snippets"],
  ["noInlineMarkup", "No inline markup"],
  ["noBlockquotes", "No blockquotes"],
  ["noLists", "No lists"],
  ["noExternalLinks", "No external links"],
  ["noWrapping", "No wrapping"],
  ["capitalizeSentences", "Capitalize sentences"],
];

const styleOptions = [
  ["underlinedHeaders", "Underlined headers"],
  ["referenceLinks", "Reference-style links"],
  ["emStyle", "_style em"],
  ["strongStyle", "__style strong text"],
  ["codeBlocks", "```-style code blocks"],
];

// Functions
const generateRandomHeading = () => {
  const getRandomWord = () =>
    latinWords[Math.floor(Math.random() * latinWords.length)];
  const length = Math.floor(Math.random() * 7) + 4;
  const words = [];
  while (words.length < length) {
    const word = getRandomWord();
    if (!words.includes(word)) {
      words.push(word);
    }
  }
  return words.join(" ");
};

const generateParagraph = () => {
  const words = [
    "Lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
    "elit", "caligine", "fassaque", "portitor", "fine", "summo", "bis",
    "est", "orbus", "aether", "bellum", "carmen", "deus", "enim", "fatum",
    "gloria", "homo", "idem", "jugum", "lumen", "mare", "nox", "opus",
    "pax", "quam", "rex", "sol", "tempus", "umbra", "vita", "vox",
    "terra", "sanctum", "virtus", "manus", "caelum", "anima", "stella", "ventus",
  ];

  const getRandomWord = () => words[Math.floor(Math.random() * words.length)];
  const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const numSentences = getRandomInt(4, 15);
  let paragraph = "";

  for (let i = 0; i < numSentences; i++) {
    const sentenceLength = getRandomInt(8, 15);
    let sentence = "";
    for (let j = 0; j < sentenceLength; j++) {
      sentence += getRandomWord() + " ";
    }
    sentence = sentence.trim() + ". ";
    if (options.value.capitalizeSentences) {
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    paragraph += sentence;
  }

  if (options.value.emStyle || options.value.strongStyle) {
    const words = paragraph.split(" ");
    words.forEach((word, i) => {
      if (Math.random() < 0.1) {
        if (options.value.emStyle) {
          words[i] = `_${word}_`;
        } else if (options.value.strongStyle) {
          words[i] = `__${word}__`;
        }
      }
    });
    paragraph = words.join(" ");
  }

  return paragraph;
};

const generateHeading = (level) => {
  const heading = generateRandomHeading();
  if (options.value.underlinedHeaders) {
    const underline =
      level === 1 ? "=".repeat(heading.length) : "-".repeat(heading.length);
    return `${heading}\n${underline}\n\n`;
  }
  return `${"#".repeat(level)} ${heading}\n\n`;
};

const generateCodeBlock = () => {
  const example = codeExamples[Math.floor(Math.random() * codeExamples.length)];
  if (options.value.codeBlocks) {
    return `\`\`\`${example.lang}\n${example.code}\n\`\`\`\n\n`;
  }
  const firstLine = example.code.split("\n")[0];
  return `\`${firstLine}\`\n\n`;
};

const generateContent = () => {
  let content = "";

  if (!options.value.noHeaders) {
    const mainHeading = generateRandomHeading();
    content += options.value.underlinedHeaders
      ? `${mainHeading}\n${"=".repeat(mainHeading.length)}\n\n`
      : `# ${mainHeading}\n\n`;
  }

  const numSubheadings = Math.max(3, Math.floor(options.value.numBlocks / 4));
  const headingPositions = new Set();
  while (headingPositions.size < numSubheadings) {
    headingPositions.add(Math.floor(Math.random() * options.value.numBlocks));
  }

  for (let i = 0; i < options.value.numBlocks; i++) {
    if (headingPositions.has(i) && !options.value.noHeaders) {
      content += generateHeading(Math.random() < 0.3 ? 3 : 2);
    }

    content += generateParagraph() + "\n\n";

    if (!options.value.noLists && i % 4 === 1) {
      content +=
        "* Sanguine mendaci in supplex vertitur moenia\n* Quae nec frondes linguae\n* Hoc adalah medendi tamen\n\n";
    }

    if (!options.value.noCodeSnippets && i % 5 === 2) {
      content += generateCodeBlock();
    }

    if (
      options.value.referenceLinks &&
      !options.value.noExternalLinks &&
      i % 3 === 0
    ) {
      content += `See [reference link][${i + 1}] for more information.\n\n`;
      content += `[${i + 1}]: https://example.com/ref${i + 1}\n`;
    } else if (!options.value.noExternalLinks && i % 3 === 0) {
      content += `See [inline link](https://example.com/page${i + 1}) for more information.\n\n`;
    }
  }

  return content;
};

// Format text for no-wrap mode: replace paragraph breaks with <br> tags
const formatNoWrap = (text) => {
  // First, escape any HTML to prevent XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Replace double newlines (paragraph breaks) with <br><br>
  // Replace single newlines with a space
  return escaped
    .replace(/\n\n+/g, '<br><br>')
    .replace(/\n/g, ' ');
};

const generateMarkdown = () => {
  isLoading.value = true;
  setTimeout(() => {
    const markdown = generateContent();
    generatedText.value = markdown;
    isLoading.value = false;
  }, 800);
};

const copyToClipboard = async () => {
  if (!generatedText.value) return;
  try {
    await navigator.clipboard.writeText(generatedText.value);
    copySuccess.value = true;
  } catch (err) {
    console.error("Failed to copy:", err);
    const textarea = document.createElement("textarea");
    textarea.value = generatedText.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    copySuccess.value = true;
  }
  setTimeout(() => (copySuccess.value = false), 2000);
};

const getFormattedDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const markdownToHtml = (markdown) => {
  let html = markdown
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^(.+)\n=+\n/gm, "<h1>$1</h1>")
    .replace(/^(.+)\n-+\n/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/```([^`]+)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^\* (.+)/gm, "<li>$1</li>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n([^#\n<].+)/g, "\n<p>$1</p>");

  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*?<\/li>(\n)?)+/gs, "<ul>$&</ul>");
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Content</title>
  <style>
    body { 
      max-width: 800px; 
      margin: 2rem auto; 
      padding: 0 1rem; 
      font-family: system-ui, -apple-system, sans-serif; 
      line-height: 1.6;
      color: #1e293b;
    }
    pre { 
      background: #f1f5f9; 
      padding: 1rem; 
      overflow-x: auto; 
      margin: 1.5rem 0;
      border-radius: 8px;
    }
    code { 
      background: #f1f5f9; 
      padding: 0.2rem 0.4rem; 
      border-radius: 4px; 
      font-family: 'JetBrains Mono', monospace;
    }
    ul { 
      margin: 1.5rem 0;
      padding-left: 2rem;
      list-style-type: disc;
    }
    li { margin: 0; padding: 0; line-height: 1.5; }
    h1, h2, h3 { margin-top: 2rem; margin-bottom: 1rem; }
    p { margin: 1rem 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
};

const downloadFile = (extension) => {
  let content = generatedText.value;
  let type = "text/plain";
  if (extension === ".html") {
    content = markdownToHtml(generatedText.value);
    type = "text/html";
  }
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Markdown-${getFormattedDate()}${extension}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const resetOptions = () => {
  options.value = {
    noHeaders: false,
    noCodeSnippets: false,
    noInlineMarkup: false,
    noBlockquotes: false,
    noLists: false,
    noExternalLinks: false,
    noWrapping: false,
    capitalizeSentences: false,
    underlinedHeaders: false,
    referenceLinks: false,
    emStyle: false,
    strongStyle: false,
    codeBlocks: false,
    numBlocks: 10,
  };
  generatedText.value = "";
  showResetToast.value = true;
  setTimeout(() => (showResetToast.value = false), 3000);
};

const toggleTheme = () => {
  const newTheme = theme.current.value.dark ? "light" : "dark";
  theme.change(newTheme);
  if (process.client) {
    localStorage.setItem("theme", newTheme);
  }
};

// Load theme from localStorage on mount
onMounted(() => {
  if (process.client) {
    const saved = localStorage.getItem("theme");
    if (saved) {
      theme.change(saved === "dark" ? "dark" : "light");
    } else {
      // Default to dark theme
      theme.change("dark");
      localStorage.setItem("theme", "dark");
    }
  }
});
</script>

<style>
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 9999;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #2563EB, #7C3AED);
  color: white;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 8px 0;
  transition: left 0.2s ease;
}
.skip-link:focus {
  left: 0;
  top: 0;
  outline: 2px solid white;
  outline-offset: 2px;
}

.max-w-xl {
  max-width: 36rem;
}

.max-w-5xl {
  max-width: 64rem;
}

/* Options grid - side by side on tablet and up */
.options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 600px) {
  .options-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
}

@media (min-width: 960px) {
  .options-grid {
    gap: 2rem;
  }
}

.footer-link {
  transition: all 0.2s ease;
}
.footer-link:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>
