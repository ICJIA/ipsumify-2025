<template>
  <v-main role="main">
    <v-container class="max-w-4xl mx-auto pa-3 pa-sm-6">
      <!-- Top navigation with reset and theme controls -->
      <div class="d-flex justify-space-between pt-2">
        <ResetButton
          :is-dark="isDark"
          aria-label="Reset options"
          @reset="resetOptions"
        />
        <ThemeToggle :is-dark="isDark" @toggle="toggleTheme" />
      </div>

      <!-- Toast notification -->
      <Toast
        :message="'Options have been reset'"
        :show="showResetToast"
        :is-dark="isDark"
      />

      <!-- Header section -->
      <header role="banner">
        <v-card
          class="mb-8 mb-sm-12 pa-4 pa-sm-8 rounded-xl text-center"
          :color="isDark ? 'grey-darken-4' : 'blue-lighten-5'"
          elevation="2"
        >
          <h1
            class="text-h3 text-sm-h4 font-serif mb-4 mx-auto"
            :class="isDark ? 'text-blue-lighten-2' : 'text-blue-darken-2'"
          >
            Ipsumify: A Lorem Ipsum Generator
          </h1>
          <p
            class="text-body-1 text-sm-body-2 max-w-2xl mx-auto"
            :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-1'"
          >
            Generate structured placeholder text in markdown format for your
            projects.
          </p>
        </v-card>
      </header>

      <!-- Instructions panel -->
      <v-card
        class="mb-6 mb-sm-8 pa-4 pa-sm-6 rounded-xl"
        :color="isDark ? 'grey-darken-4' : 'white'"
        elevation="2"
      >
        <p
          class="text-center"
          :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-2'"
        >
          Configure your options below and generate customized markdown content.
        </p>
      </v-card>

      <!-- Options grid -->
      <v-row class="mb-6 mb-sm-8">
        <v-col cols="12" sm="6">
          <v-card
            class="pa-4 pa-sm-6 rounded-xl"
            :color="isDark ? 'grey-darken-4' : 'white'"
            elevation="2"
          >
            <h2
              class="font-weight-bold mb-4 text-h6 border-b pb-2"
              :class="isDark ? 'text-grey-lighten-4' : 'text-grey-darken-4'"
            >
              Basic Options
            </h2>
            <div class="d-flex flex-column ga-3">
              <v-checkbox
                v-for="[key, label] in basicOptions"
                :key="key"
                v-model="options[key]"
                :label="label"
                hide-details
                density="compact"
              />
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            class="pa-4 pa-sm-6 rounded-xl"
            :color="isDark ? 'grey-darken-4' : 'white'"
            elevation="2"
          >
            <h2
              class="font-weight-bold mb-4 text-h6 border-b pb-2"
              :class="isDark ? 'text-grey-lighten-4' : 'text-grey-darken-4'"
            >
              Style Options
            </h2>
            <div class="d-flex flex-column ga-3">
              <v-checkbox
                v-for="[key, label] in styleOptions"
                :key="key"
                v-model="options[key]"
                :label="label"
                hide-details
                density="compact"
              />
              <div class="mt-4">
                <v-text-field
                  v-model.number="options.numBlocks"
                  type="number"
                  density="compact"
                  variant="outlined"
                  label="Number of blocks"
                  min="1"
                  max="10"
                  hide-details
                  style="max-width: 120px"
                />
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action buttons -->
      <div class="mb-6 mb-sm-8">
        <v-btn
          @click="generateMarkdown"
          :disabled="isLoading"
          color="primary"
          size="large"
          block
          class="rounded-xl"
        >
          {{ isLoading ? "Generating..." : "Generate some markdown!" }}
        </v-btn>
      </div>

      <!-- Loading spinner -->
      <div v-if="isLoading" class="mt-6">
        <div class="d-flex justify-center pa-12">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
        </div>
      </div>

      <!-- Generated content -->
      <div v-if="!isLoading && generatedText" class="mt-6">
        <div
          class="d-flex flex-column flex-sm-row justify-space-between ga-3 ga-sm-2 mb-4"
        >
          <v-btn
            @click="copyToClipboard"
            :color="copySuccess ? 'primary' : 'success'"
            class="rounded-xl"
          >
            <v-icon start>mdi-content-copy</v-icon>
            {{ copySuccess ? "Copied!" : "Copy to Clipboard" }}
          </v-btn>
          <div class="d-flex ga-2">
            <v-btn
              v-for="ext in ['.md', '.txt', '.html']"
              :key="ext"
              @click="downloadFile(ext)"
              color="purple"
              class="rounded-xl"
            >
              Download {{ ext }}
            </v-btn>
          </div>
        </div>
        <v-card
          class="pa-4 pa-sm-6 rounded-xl font-mono text-body-2"
          :color="isDark ? 'grey-darken-4' : 'white'"
          elevation="2"
        >
          <pre
            :class="
              options.noWrapping
                ? 'overflow-x-auto whitespace-nowrap'
                : 'whitespace-pre-wrap'
            "
            class="ma-0"
            >{{
              options.noWrapping
                ? generatedText.replace(/\n/g, " ")
                : generatedText
            }}</pre
          >
        </v-card>
      </div>

      <!-- Footer -->
      <footer
        role="contentinfo"
        class="mt-8 mt-sm-16 pt-6 pt-sm-8 border-t text-center"
        :class="
          isDark
            ? 'border-grey-darken-2 text-grey-lighten-1'
            : 'border-grey-lighten-2 text-grey-darken-1'
        "
      >
        <div class="d-flex justify-center align-center ga-4">
          <a
            href="https://github.com/ICJIA/ipsumify-2025"
            target="_blank"
            rel="noopener noreferrer"
            class="text-decoration-none d-inline-flex align-center"
            :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-1'"
          >
            <v-icon class="mr-2">mdi-github</v-icon>
            View on GitHub
          </a>
          <a
            href="/documentation/accessibility/index.html"
            class="text-decoration-none d-inline-flex align-center"
            :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-1'"
          >
            <v-icon class="mr-2">mdi-accessibility</v-icon>
            Accessibility Report
          </a>
        </div>
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
  "Aether",
  "Bellum",
  "Carmen",
  "Deus",
  "Enim",
  "Fatum",
  "Gloria",
  "Homo",
  "Idem",
  "Jugum",
  "Lumen",
  "Mare",
  "Nox",
  "Opus",
  "Pax",
  "Quam",
  "Rex",
  "Sol",
  "Tempus",
  "Umbra",
  "Vita",
  "Vox",
  "Terra",
  "Sanctum",
  "Virtus",
  "Manus",
  "Caelum",
  "Anima",
  "Stella",
  "Ventus",
  "Magnus",
  "Patria",
  "Fortis",
  "Sapiens",
  "Veritas",
  "Natura",
  "Vis",
  "Lex",
  "Fides",
  "Amor",
  "Mors",
  "Pater",
  "Mater",
  "Filius",
  "Roma",
  "Diem",
  "Numen",
  "Corpus",
  "Annus",
  "Ignis",
  "Aqua",
  "Arbor",
  "Mons",
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
    "Lorem",
    "ipsum",
    "dolor",
    "sit",
    "amet",
    "consectetur",
    "adipiscing",
    "elit",
    "caligine",
    "fassaque",
    "portitor",
    "fine",
    "summo",
    "bis",
    "est",
    "orbus",
    "aether",
    "bellum",
    "carmen",
    "deus",
    "enim",
    "fatum",
    "gloria",
    "homo",
    "idem",
    "jugum",
    "lumen",
    "mare",
    "nox",
    "opus",
    "pax",
    "quam",
    "rex",
    "sol",
    "tempus",
    "umbra",
    "vita",
    "vox",
    "terra",
    "sanctum",
    "virtus",
    "manus",
    "caelum",
    "anima",
    "stella",
    "ventus",
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
      content += `See [inline link](https://example.com/page${
        i + 1
      }) for more information.\n\n`;
    }
  }

  return content;
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
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
    }
    pre { 
      background: #f5f5f5; 
      padding: 1rem; 
      overflow-x: auto; 
      margin: 1.5rem 0;
    }
    code { 
      background: #f5f5f5; 
      padding: 0.2rem 0.4rem; 
      border-radius: 3px; 
    }
    ul { 
      margin: 1.5rem 0;
      padding-left: 2rem;
      list-style-type: disc;
    }
    li {
      margin: 0;
      padding: 0;
      line-height: 1.5;
    }
    h1, h2, h3 { 
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    p {
      margin: 1rem 0;
    }
    ul + p,
    ul + h1,
    ul + h2,
    ul + h3,
    ul + pre {
      margin-top: 1.5rem;
      margin-left: 0;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
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
