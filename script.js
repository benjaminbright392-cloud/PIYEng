"use strict";

/* PRINCE IGNITE YOUR ENGLISH — COMPLETE MAIN JAVASCRIPT
   Save this file as script.js beside index.html and style.css.
   The catalogue contains generated study-topic variations; not every
   catalogue entry has a separately authored lesson yet.
*/

const $ = (id) => document.getElementById(id);
const TOTAL_BASIC = 5000;
const TOTAL_ADVANCED = 3000;
const TOTAL_TOPICS = TOTAL_BASIC + TOTAL_ADVANCED;
const PAGE_SIZE = 10;
const CERTIFICATE_TARGET = 6000;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}
function safeLoad(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch { return fallback; }
}
function saveValue(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

let completed = new Set(
  Array.isArray(safeLoad("piye_completed_v1", []))
    ? safeLoad("piye_completed_v1", []).filter(x => typeof x === "string")
    : []
);
let historyRead = new Set(
  Array.isArray(safeLoad("piye_history_v1", []))
    ? safeLoad("piye_history_v1", [])
    : []
);
let learnerName = String(safeLoad("piye_name_v1", "") || "");
let page = { basic: 1, advanced: 1 };
let currentTopic = null;
let quizState = { score: 0, correct: 0, played: 0 };
let quizQuestion = null;
let scrambleWord = "";
let wordShown = false;

function saveProgress() {
  saveValue("piye_completed_v1", [...completed]);
  saveValue("piye_history_v1", [...historyRead]);
  saveValue("piye_name_v1", learnerName);
}

/* NAVIGATION */
function showView(view) {
  const allowed = ["home", "basic", "advanced", "games", "history", "certificate"];
  if (!allowed.includes(view)) return;
  allowed.forEach(name => {
    const section = $("view-" + name);
    if (section) section.classList.toggle("hidden", name !== view);
  });
  document.querySelectorAll(".nav [data-view]").forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (view === "basic") renderTopics("basic");
  if (view === "advanced") renderTopics("advanced");
  if (view === "certificate") updateCertificate();
  updateDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll(".nav [data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

/* TOPIC CATALOGUE */
const basicSeeds = [
  ["Alphabet and Letter Names","Vocabulary"],["Vowel and Consonant Sounds","Pronunciation"],
  ["Common Everyday Words","Vocabulary"],["Greetings and Introductions","Speaking"],
  ["Introducing Yourself","Speaking"],["Nouns","Grammar"],["Proper and Common Nouns","Grammar"],
  ["Pronouns","Grammar"],["Personal Pronouns","Grammar"],["Possessive Pronouns","Grammar"],
  ["Verbs","Grammar"],["Action Verbs","Grammar"],["Adjectives","Grammar"],["Adverbs","Grammar"],
  ["Prepositions","Grammar"],["Conjunctions","Grammar"],["Articles: A, An and The","Grammar"],
  ["Singular and Plural Nouns","Grammar"],["Countable and Uncountable Nouns","Grammar"],
  ["Subject-Verb Agreement","Grammar"],["Present Simple Tense","Grammar"],
  ["Present Continuous Tense","Grammar"],["Past Simple Tense","Grammar"],
  ["Past Continuous Tense","Grammar"],["Present Perfect Tense","Grammar"],
  ["Future Simple Tense","Grammar"],["Question Formation","Grammar"],["Negative Sentences","Grammar"],
  ["Sentence Structure","Grammar"],["Simple and Compound Sentences","Grammar"],
  ["Capital Letters","Writing"],["Full Stops and Question Marks","Writing"],
  ["Commas and Apostrophes","Writing"],["Spelling Common Words","Writing"],
  ["Synonyms and Antonyms","Vocabulary"],["Homophones","Vocabulary"],["Word Families","Vocabulary"],
  ["Reading for Main Ideas","Reading"],["Reading for Details","Reading"],
  ["Reading Comprehension","Reading"],["Writing a Paragraph","Writing"],
  ["Writing a Personal Letter","Writing"],["Describing People","Writing"],
  ["Describing Places","Writing"],["Giving Directions","Everyday English"],
  ["Shopping Conversations","Everyday English"],["Asking for Help Politely","Speaking"],
  ["Telephone Conversations","Speaking"],["Pronouncing Difficult Words","Pronunciation"],
  ["Word Stress","Pronunciation"],["Listening for Key Information","Speaking"],
  ["Telling the Time","Everyday English"],["Days, Months and Dates","Vocabulary"],
  ["Numbers and Quantities","Vocabulary"],["Comparative Adjectives","Grammar"],
  ["Superlative Adjectives","Grammar"],["Modal Verbs","Grammar"],
  ["Imperative Sentences","Grammar"],["Contractions","Grammar"],["Writing a Short Story","Writing"]
];
const advancedSeeds = [
  ["Academic Vocabulary","Advanced Vocabulary"],["Collocations in Academic English","Advanced Vocabulary"],
  ["Idioms and Figurative Meaning","Advanced Vocabulary"],["Nuance and Connotation","Advanced Vocabulary"],
  ["Register and Audience","Professional English"],["Formal and Informal English","Professional English"],
  ["Subject-Verb Agreement in Complex Sentences","Grammar & Syntax"],
  ["Conditional Sentences","Grammar & Syntax"],["Inversion for Emphasis","Grammar & Syntax"],
  ["Subjunctive Mood","Grammar & Syntax"],["Participial Clauses","Grammar & Syntax"],
  ["Relative Clauses","Grammar & Syntax"],["Parallel Structure","Grammar & Syntax"],
  ["Dangling Modifiers","Grammar & Syntax"],["Sentence Variety and Rhythm","Grammar & Syntax"],
  ["Active and Passive Voice","Grammar & Syntax"],["Reported Speech","Grammar & Syntax"],
  ["Hedging in Academic Writing","Academic Writing"],["Nominalisation","Academic Writing"],
  ["Thesis Statements","Academic Writing"],["Writing Strong Topic Sentences","Academic Writing"],
  ["Coherence and Cohesion","Academic Writing"],["Paraphrasing and Summarising","Academic Writing"],
  ["Integrating Evidence","Academic Writing"],["Avoiding Ambiguous Claims","Academic Writing"],
  ["Editing for Concision","Academic Writing"],["Argument Structure","Rhetoric"],
  ["Ethos, Pathos and Logos","Rhetoric"],["Metaphor and Simile","Rhetoric"],
  ["Irony and Satire","Rhetoric"],["Rhetorical Questions","Rhetoric"],
  ["Persuasive Techniques","Rhetoric"],["Logical Fallacies","Critical Reading"],
  ["Evaluating Sources","Critical Reading"],["Fact, Opinion and Inference","Critical Reading"],
  ["Analysing an Author's Purpose","Critical Reading"],["Bias and Framing","Critical Reading"],
  ["Critical Thinking","Critical Reading"],["Professional Email Writing","Professional English"],
  ["Writing Executive Summaries","Professional English"],["Diplomatic Disagreement","Professional English"],
  ["Presentation Language","Professional English"],["Negotiation Vocabulary","Professional English"],
  ["Literary Themes","Literature"],["Characterisation","Literature"],
  ["Narrative Perspective","Literature"],["Symbolism in Literature","Literature"],
  ["Diction and Tone","Literature"],["Close Reading","Literature"],["Literary Allusion","Literature"]
];
const variations = [
  "with Clear Examples","Common Mistakes and Corrections","Practice and Review",
  "in Everyday Communication","in Reading and Writing","with Guided Exercises",
  "in Formal Communication","in Real-World Contexts","Rules and Applications","Advanced Practice"
];
function makeLibrary(seeds, total, prefix) {
  const result = seeds.map(([title, category], index) => ({
    id: prefix + index, title, category,
    desc: `Learn ${title.toLowerCase()} through explanations, examples and guided practice.`
  })).slice(0, total);
  let n = 0;
  while (result.length < total) {
    const seed = seeds[n % seeds.length];
    const variation = variations[Math.floor(n / seeds.length) % variations.length];
    result.push({
      id: prefix + result.length,
      title: `${seed[0]}: ${variation}`,
      category: seed[1],
      desc: `Study ${seed[0].toLowerCase()} through ${variation.toLowerCase()}.`
    });
    n++;
  }
  return result;
}
const basicTopics = makeLibrary(basicSeeds, TOTAL_BASIC, "b");
const advancedTopics = makeLibrary(advancedSeeds, TOTAL_ADVANCED, "a");

function findElement(ids) {
  for (const id of ids) { const el = $(id); if (el) return el; }
  return null;
}
function topicContainer(level) {
  return findElement(level === "basic"
    ? ["basicTopics","basicGrid","basicList","basicResults","basicTopicList","basicTopicGrid","topicGridBasic"]
    : ["advancedTopics","advancedGrid","advancedList","advancedResults","advancedTopicList","advancedTopicGrid","topicGridAdvanced"]);
}
function searchInput(level) {
  return findElement(level === "basic"
    ? ["basicSearch","searchBasic","basicTopicSearch"]
    : ["advancedSearch","searchAdvanced","advancedTopicSearch"]);
}
function categoryInput(level) {
  return findElement(level === "basic"
    ? ["basicCategory","filterBasic","basicFilter"]
    : ["advancedCategory","filterAdvanced","advancedFilter"]);
}
function paginationContainer(level) {
  return findElement(level === "basic"
    ? ["basicPagination","paginationBasic","basicPages"]
    : ["advancedPagination","paginationAdvanced","advancedPages"]);
}
function renderTopics(level) {
  const container = topicContainer(level);
  if (!container) return;
  const all = level === "basic" ? basicTopics : advancedTopics;
  const query = (searchInput(level)?.value || "").trim().toLowerCase();
  const category = categoryInput(level)?.value || "all";
  const filtered = all.filter(topic =>
    (!query || (topic.title + " " + topic.category + " " + topic.desc).toLowerCase().includes(query)) &&
    (category === "all" || category === "" || topic.category === category)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  page[level] = Math.min(Math.max(1, page[level]), pages);
  const start = (page[level] - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  container.innerHTML = visible.length ? visible.map(topic => {
    const done = completed.has(topic.id);
    return `<article class="topic-card ${done ? "completed" : ""}">
      <div class="topic-meta"><span class="pill">${escapeHtml(topic.category)}</span>
      <span>${done ? "✓ Completed" : escapeHtml(level === "basic" ? "Basic" : "Advanced")}</span></div>
      <h3>${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.desc)}</p>
      <button type="button" onclick="openTopic('${topic.id}','${level}')">${done ? "Review lesson" : "Start lesson"}</button>
    </article>`;
  }).join("") : `<div class="panel"><p>No topics found. Try another search or category.</p></div>`;
  const count = findElement(level === "basic"
    ? ["basicCount","basicResultsCount","basicTopicCount"]
    : ["advancedCount","advancedResultsCount","advancedTopicCount"]);
  if (count) count.textContent = `${filtered.length.toLocaleString()} topics`;
  const pager = paginationContainer(level);
  if (pager) {
    pager.innerHTML = `<button type="button" ${page[level] <= 1 ? "disabled" : ""} onclick="changePage('${level}',-1)">Previous</button>
      <span>Page ${page[level]} of ${pages}</span>
      <button type="button" ${page[level] >= pages ? "disabled" : ""} onclick="changePage('${level}',1)">Next</button>`;
  }
}
function changePage(level, amount) {
  page[level] = Math.max(1, page[level] + amount);
  renderTopics(level);
  const container = topicContainer(level);
  if (container) container.scrollIntoView({ behavior: "smooth", block: "start" });
}
["basic","advanced"].forEach(level => {
  searchInput(level)?.addEventListener("input", () => { page[level] = 1; renderTopics(level); });
  categoryInput(level)?.addEventListener("change", () => { page[level] = 1; renderTopics(level); });
});

/* LESSONS */
const lessons = {
  "nouns": {
    definition: "A noun names a person, place, animal, object or idea.",
    rules: ["Common nouns name general things: teacher, city, book.","Proper nouns identify specific names: Ada, Lagos, Nigeria.","Abstract nouns name ideas or qualities: courage, honesty, joy."],
    examples: ["The teacher explained the lesson.","Lagos is a busy city.","Honesty is an important quality."],
    mistakes: ["Incorrect: She is a honesty person.","Correct: She is an honest person."],
    exercise: "Identify the nouns in: The young boy carried a bag to school."
  },
  "verbs": {
    definition: "A verb expresses an action, event or state.",
    rules: ["Action verbs include run, write, think and build.","Linking verbs connect a subject to a description.","In the present simple, he, she and it usually take a verb ending in -s or -es."],
    examples: ["I study English every day.","She writes clearly.","They are ready."],
    mistakes: ["Incorrect: She go to school.","Correct: She goes to school.","Incorrect: They is ready.","Correct: They are ready."],
    exercise: "Choose the correct form: My brother (play / plays) football."
  },
  "adjectives": {
    definition: "An adjective describes a noun or pronoun.",
    rules: ["Adjectives describe qualities, size, age, colour and other features.","Comparatives compare two things: taller, more useful.","Superlatives identify the highest or lowest degree: tallest, most useful."],
    examples: ["She bought an expensive phone.","This book is more interesting than that one.","He is the tallest student in the group."],
    mistakes: ["Incorrect: more better.","Correct: better."],
    exercise: "Complete the sentence: This question is (easy) than the last one."
  },
  "adverbs": {
    definition: "An adverb modifies a verb, adjective or another adverb.",
    rules: ["Manner: She speaks clearly.","Time: We will leave tomorrow.","Frequency: He usually arrives early.","Degree: The lesson was extremely useful."],
    examples: ["The athlete ran quickly.","I rarely miss lessons.","She speaks confidently."],
    mistakes: ["Incorrect: She sings beautiful.","Correct: She sings beautifully."],
    exercise: "Choose correctly: The student answered (correct / correctly)."
  },
  "present simple tense": {
    definition: "The present simple describes habits, routines, general truths and repeated actions.",
    rules: ["Use the base verb with I, you, we and they.","Add -s or -es to most verbs with he, she or it.","Use do or does for most questions and negatives.","Use the tense for habits and general truths."],
    examples: ["I study every evening.","She studies every evening.","They do not understand.","Does he speak English?"],
    mistakes: ["Incorrect: Does she speaks English?","Correct: Does she speak English?"],
    exercise: "Complete: My father ____ (work) in Lagos."
  },
  "past simple tense": {
    definition: "The past simple describes completed past events.",
    rules: ["Regular verbs usually take -ed: work becomes worked.","Irregular verbs change form: go becomes went.","Use did not plus the base verb for most negative statements.","Use did before the subject in most questions."],
    examples: ["I visited my aunt yesterday.","She went to school.","They did not attend.","Did you finish the work?"],
    mistakes: ["Incorrect: I did not went.","Correct: I did not go."],
    exercise: "Rewrite in the past tense: They go to the library."
  },
  "future simple tense": {
    definition: "The future simple commonly uses will plus the base verb for predictions, promises and decisions.",
    rules: ["Use will plus the base verb.","Use will not or won't for negatives.","Place will before the subject to form questions.","Going to is another common way to express future meaning."],
    examples: ["I will study tomorrow.","She will not forget.","Will they attend?","It is going to rain."],
    mistakes: ["Incorrect: She will goes.","Correct: She will go."],
    exercise: "Complete: I think our team ____ (win) the match."
  },
  "subject-verb agreement": {
    definition: "Subject-verb agreement means matching the verb to its subject.",
    rules: ["A singular third-person subject takes a singular present-tense verb.","Plural subjects generally use the base verb.","Words between a subject and its verb do not automatically change the subject's number.","Each of the students is singular in standard usage."],
    examples: ["The list of items is on the table.","Each player has a uniform.","The teachers are present."],
    mistakes: ["Incorrect: Each students have a book.","Correct: Each student has a book."],
    exercise: "Choose: The quality of these products (is / are) excellent."
  },
  "active and passive voice": {
    definition: "Active voice emphasises the performer of an action. Passive voice emphasises the receiver of the action.",
    rules: ["Active: subject + verb + object.","Passive: object + an appropriate form of be + past participle.","Keep the tense consistent when changing voices.","Use passive voice when the action or receiver deserves emphasis."],
    examples: ["Active: The student wrote the essay.","Passive: The essay was written by the student.","Active: The chef prepares the meal.","Passive: The meal is prepared by the chef."],
    mistakes: ["Incorrect: The letter was wrote.","Correct: The letter was written."],
    exercise: "Change to passive voice: The teacher marked the examination."
  },
  "metaphor": {
    definition: "A metaphor describes one thing in terms of another to create figurative meaning.",
    rules: ["A metaphor makes a comparison without using like or as.","It can make abstract ideas easier to imagine.","Interpret figurative language in context."],
    examples: ["Time is a thief.","Her voice was music to our ears.","The classroom was a zoo."],
    mistakes: ["Do not always interpret a metaphor literally.","Avoid mixing metaphors when the result confuses the reader."],
    exercise: "Explain the figurative meaning of: He has a heart of stone."
  },
  "formal and informal english": {
    definition: "Formal English is common in official, academic and professional situations. Informal English is common in relaxed conversations.",
    rules: ["Choose a style that suits the audience and purpose.","Formal writing generally avoids slang.","Informal English often uses contractions and conversational expressions.","Neither style is always better; context determines what is appropriate."],
    examples: ["Informal: Can you help me out?","Formal: Could you please assist me?","Informal: The results were really good.","Formal: The results were highly satisfactory."],
    mistakes: ["Avoid slang in a formal report unless relevant.","Do not make simple writing unnecessarily complicated."],
    exercise: "Rewrite formally: Hey, send me the details quickly."
  },
  "critical thinking": {
    definition: "Critical thinking involves analysing information, evaluating evidence and reaching reasoned conclusions.",
    rules: ["Separate facts from opinions.","Check the reliability of sources.","Consider alternative explanations.","Avoid general conclusions based on insufficient evidence."],
    examples: ["Claim: A new study method improves results.","Question: What evidence supports the claim?","Evaluation: Examine reliable evidence before drawing a conclusion."],
    mistakes: ["One personal experience does not prove a claim is true for everyone.","Confidence alone does not make a statement reliable."],
    exercise: "Someone says everyone using an app becomes successful. What evidence would you ask for?"
  },
  "punctuation": {
    definition: "Punctuation marks organise writing and clarify meaning.",
    rules: ["Use a full stop to end a statement.","Use a question mark after a direct question.","Use commas to separate list items where appropriate.","Use apostrophes for possession and contractions."],
    examples: ["I bought pens, books and notebooks.","Where are you going?","Ada's bag is here.","It's raining."],
    mistakes: ["Its raining → It's raining.","Where are you going. → Where are you going?"],
    exercise: "Punctuate: where did you put my English textbook"
  }
};

function lessonContent(topic, level) {
  const key = topic.title.toLowerCase();
  const lesson = lessons[key];
  if (!lesson) {
    return `<div class="pill">${escapeHtml(topic.category)} · ${level === "advanced" ? "Advanced" : "Basic"}</div>
      <h3>${escapeHtml(topic.title)}</h3>
      <section><h4>Lesson Overview</h4><p>${escapeHtml(topic.desc)}</p>
      <p>Study the meaning, main rules and examples related to this topic.</p></section>
      <section><h4>Study Steps</h4><ol>
      <li>Write a definition in your own words.</li><li>Identify three important rules or features.</li>
      <li>Find or create three correct examples.</li><li>Explain why each example is correct.</li>
      <li>Write and answer a practice question.</li></ol></section>
      <div class="lesson-exercise"><h4>Practice Exercise</h4>
      <p>Explain “${escapeHtml(topic.title)}”, give three examples and identify one common mistake.</p></div>
      <div class="notice">This topic has a guided study outline. A dedicated, fully written lesson has not yet been added.</div>`;
  }
  return `<div class="pill">${escapeHtml(topic.category)} · ${level === "advanced" ? "Advanced" : "Basic"}</div>
    <h3>${escapeHtml(topic.title)}</h3>
    <section><h4>What It Means</h4><p>${escapeHtml(lesson.definition)}</p></section>
    <section><h4>Rules to Remember</h4><ul>${lesson.rules.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></section>
    <section><h4>Examples</h4><ul>${lesson.examples.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></section>
    <section><h4>Common Mistakes</h4><ul>${lesson.mistakes.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></section>
    <div class="lesson-exercise"><h4>Practice Exercise</h4><p>${escapeHtml(lesson.exercise)}</p>
    <label for="lessonAnswer">Your answer</label><textarea id="lessonAnswer" rows="3" placeholder="Write your answer here..."></textarea></div>`;
}
function lessonPanel() {
  return findElement(["lessonPanel","lessonContent","lessonModalContent","lessonArea"]);
}
function openTopic(id, level) {
  const list = level === "advanced" ? advancedTopics : basicTopics;
  const topic = list.find(item => item.id === id);
  if (!topic) return;
  currentTopic = { ...topic, level };
  const panel = lessonPanel();
  const html = `<div class="lesson-header"><button type="button" onclick="closeLesson()">← Back to topics</button>
    <span>${completed.has(topic.id) ? "✓ Completed" : "In progress"}</span></div>
    ${lessonContent(topic, level)}
    <div class="lesson-actions"><button type="button" onclick="markTopicComplete('${topic.id}','${level}')">${completed.has(topic.id) ? "Completed ✓" : "Mark as completed"}</button></div>`;
  if (panel) {
    panel.innerHTML = html;
    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    const view = $("view-" + level);
    if (view) {
      let created = $("lessonPanelFallback");
      if (!created) {
        created = document.createElement("div");
        created.id = "lessonPanelFallback";
        created.className = "panel";
        view.prepend(created);
      }
      created.innerHTML = html;
      created.classList.remove("hidden");
      created.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
function closeLesson() {
  const panel = lessonPanel() || $("lessonPanelFallback");
  if (panel) panel.classList.add("hidden");
}
function markTopicComplete(id, level) {
  completed.add(id);
  saveProgress();
  updateDashboard();
  updateCertificate();
  renderTopics(level);
  if (currentTopic && currentTopic.id === id) openTopic(id, level);
}
window.openTopic = openTopic;
window.closeLesson = closeLesson;
window.markTopicComplete = markTopicComplete;
window.changePage = changePage;

/* DASHBOARD AND CERTIFICATE */
function updateDashboard() {
  const count = completed.size;
  const percent = Math.min(100, Math.round(count / TOTAL_TOPICS * 100));
  const basicDone = [...completed].filter(id => id.startsWith("b")).length;
  const advancedDone = [...completed].filter(id => id.startsWith("a")).length;
  const setText = (ids, text) => { const el = findElement(ids); if (el) el.textContent = text; };
  setText(["completedCount","topicsCompleted","progressCount"], count.toLocaleString());
  setText(["progressPercent","overallPercent"], percent + "%");
  setText(["basicCompleted"], basicDone.toLocaleString());
  setText(["advancedCompleted"], advancedDone.toLocaleString());
  setText(["heroPercent"], percent + "%");
  const heroBar = $("heroBar");
  if (heroBar) heroBar.style.width = percent + "%";
  const heroProgress = $("heroProgress");
  if (heroProgress) heroProgress.setAttribute("aria-valuenow", String(percent));
  const bar = $("overallBar") || $("progressBar");
  if (bar) bar.style.width = percent + "%";
  const certificateNote = $("certificateStatus") || $("certStatus");
  if (certificateNote) certificateNote.textContent = count >= CERTIFICATE_TARGET
    ? "Certificate unlocked — congratulations!" : `${(CERTIFICATE_TARGET - count).toLocaleString()} more topics to unlock your certificate.`;
}
function updateCertificate() {
  const count = completed.size;
  const percent = Math.min(100, Math.round(count / CERTIFICATE_TARGET * 100));
  const bar = $("certBar");
  if (bar) bar.style.width = percent + "%";
  const certProgressBar = $("certProgressBar");
  if (certProgressBar) certProgressBar.setAttribute("aria-valuenow", String(percent));
  const text = $("certProgressText") || $("certificateProgress");
  if (text) text.textContent = `${Math.min(count, CERTIFICATE_TARGET).toLocaleString()} / ${CERTIFICATE_TARGET.toLocaleString()} topics (${percent}%)`;
  const locked = $("certificateLocked");
  if (locked) locked.classList.toggle("hidden", count >= CERTIFICATE_TARGET);
  const unlocked = $("certificateUnlocked");
  if (unlocked) unlocked.classList.toggle("hidden", count < CERTIFICATE_TARGET);
  const nameInput = $("certificateName") || $("learnerName");
  if (nameInput && !nameInput.value) nameInput.value = learnerName;
  const button = $("generateCertificate");
  if (button) button.disabled = count < CERTIFICATE_TARGET;
}
function generateCertificate() {
  if (completed.size < CERTIFICATE_TARGET) {
    alert(`Complete ${CERTIFICATE_TARGET.toLocaleString()} topics to unlock your certificate.`);
    return;
  }
  const input = $("certificateName") || $("learnerName") || $("certName");
  learnerName = (input?.value || learnerName || "English Learner").trim();
  if (!learnerName) learnerName = "English Learner";
  saveProgress();
  const cert = $("certificatePrint") || $("certificateCard") || $("certificateUnlocked");
  if (cert) {
    cert.innerHTML = `<div class="certificate-design"><p>PRINCE IGNITE YOUR ENGLISH</p>
      <h2>Certificate of Achievement</h2><p>This certifies that</p>
      <h1>${escapeHtml(learnerName)}</h1>
      <p>has completed at least 75% of the English learning programme.</p>
      <strong>Congratulations!</strong><p>English Learning Achievement · ${new Date().getFullYear()}</p>
      <button type="button" onclick="window.print()">Print / Save as PDF</button></div>`;
    cert.classList.remove("hidden");
  } else {
    alert(`Congratulations, ${learnerName}! You have unlocked your certificate. Use your browser's Print option to save the page as PDF.`);
    window.print();
  }
}
window.updateCertificate = updateCertificate;
window.generateCertificate = generateCertificate;

/* ENGLISH HISTORY */
const historyDetails = {
  old: "Old English developed in early medieval Britain and was strongly influenced by Germanic languages.",
  middle: "Middle English developed after the Norman Conquest of 1066 and absorbed many French words.",
  modern: "Modern English developed through major changes in pronunciation, spelling, vocabulary and grammar. Printing helped spread more standardised forms.",
  global: "English spread globally through migration, trade, colonisation, education, science, media and the internet. It now has many regional varieties."
};
function completeHistory(id) {
  historyRead.add(id);
  saveProgress();
  const button = document.querySelector(`[onclick="completeHistory('${id}')"]`);
  if (button) {
    button.textContent = "Read ✓";
    button.disabled = true;
  }
  const detail = $("historyDetail");
  if (detail && historyDetails[id]) detail.textContent = historyDetails[id];
  updateDashboard();
}
window.completeHistory = completeHistory;
function restoreHistoryButtons() {
  historyRead.forEach(id => {
    const button = document.querySelector(`[onclick="completeHistory('${id}')"]`);
    if (button) { button.textContent = "Read ✓"; button.disabled = true; }
  });
}

/* GAMES */
const quizQuestions = [
  { q: "Choose the correct sentence.", options: ["She go to school.","She goes to school.","She going school."], answer: 1, explain: "Use goes with she in the present simple." },
  { q: "What is the plural of 'child'?", options: ["Childs","Childes","Children"], answer: 2, explain: "The plural of child is children." },
  { q: "Choose the correct article: ___ apple.", options: ["A","An","The a"], answer: 1, explain: "Use an before a vowel sound." },
  { q: "Which word is an adjective?", options: ["Quickly","Beautiful","Run"], answer: 1, explain: "Beautiful describes a noun." },
  { q: "Choose the past tense of 'go'.", options: ["Goed","Went","Gone yesterday"], answer: 1, explain: "The past simple form is went." },
  { q: "Which mark ends a direct question?", options: ["?","! ",","], answer: 0, explain: "A question mark ends a direct question." },
  { q: "Choose the correct phrase.", options: ["More better","Bestest","Better"], answer: 2, explain: "Better is the comparative form of good." },
  { q: "Which is a synonym for 'rapid'?", options: ["Slow","Fast","Quiet"], answer: 1, explain: "Rapid means fast or quick." },
  { q: "Choose the correct sentence.", options: ["They are ready.","They is ready.","They am ready."], answer: 0, explain: "Use are with they." },
  { q: "Which word is a noun?", options: ["Happiness","Happily","Happy"], answer: 0, explain: "Happiness is the name of a state or idea." }
];
function gameArea() { return $("gameArea"); }
function setGame(title, subtitle, html) {
  const area = gameArea();
  if (!area) { alert("Add an element with id=\"gameArea\" to your HTML to display games."); return; }
  area.innerHTML = `<h2 id="gameTitle">${escapeHtml(title)}</h2><p id="gameSubtitle">${escapeHtml(subtitle)}</p>${html}`;
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}
function updateGameStats() {
  const score = $("gameScore"); if (score) score.textContent = quizState.score;
  const correct = $("gameCorrect"); if (correct) correct.textContent = quizState.correct;
  const played = $("gamePlayed"); if (played) played.textContent = quizState.played;
}
function startQuiz() {
  const q = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  quizQuestion = q;
  setGame("Quick English Quiz", "Choose the best answer.", `<div class="quiz-question"><h3>${escapeHtml(q.q)}</h3>
    <div class="quiz-options">${q.options.map((option, i) =>
      `<button type="button" onclick="answerQuiz(${i})">${escapeHtml(option)}</button>`).join("")}</div>
    <p id="quizFeedback" aria-live="polite"></p><button type="button" onclick="startQuiz()">Next question</button></div>`);
}
function answerQuiz(index) {
  if (!quizQuestion) return;
  const feedback = $("quizFeedback");
  quizState.played++;
  if (index === quizQuestion.answer) {
    quizState.score += 10; quizState.correct++;
    if (feedback) feedback.textContent = "Correct! " + quizQuestion.explain;
  } else if (feedback) {
    feedback.textContent = "Not quite. " + quizQuestion.explain;
  }
  updateGameStats();
  document.querySelectorAll(".quiz-options button").forEach(button => button.disabled = true);
}
function newScramble() {
  const words = ["language","grammar","education","beautiful","knowledge","sentence","pronunciation","vocabulary","history","confidence","learning","dictionary"];
  scrambleWord = words[Math.floor(Math.random() * words.length)];
  let scrambled = scrambleWord;
  while (scrambled === scrambleWord && scrambleWord.length > 2) {
    scrambled = scrambleWord.split("").sort(() => Math.random() - 0.5).join("");
  }
  setGame("Word Scramble", "Unscramble the letters to make an English word.", `<div class="scramble-game">
    <p class="scramble-letters">${escapeHtml(scrambled.toUpperCase())}</p>
    <label for="scrambleAnswer">Your answer</label><input id="scrambleAnswer" type="text" autocomplete="off" placeholder="Type the word">
    <button type="button" onclick="checkScramble()">Check answer</button>
    <p id="scrambleFeedback" aria-live="polite"></p><button type="button" onclick="newScramble()">New word</button></div>`);
}
function checkScramble() {
  const answer = ($("scrambleAnswer")?.value || "").trim().toLowerCase();
  const feedback = $("scrambleFeedback");
  quizState.played++;
  if (answer === scrambleWord) {
    quizState.score += 10; quizState.correct++;
    if (feedback) feedback.textContent = "Correct! The word is " + scrambleWord + ".";
  } else if (feedback) feedback.textContent = "Try again. Hint: the word has " + scrambleWord.length + " letters.";
  updateGameStats();
}
const dailyWords = [
  ["Curious","Eager to learn or know something."],
  ["Resilient","Able to recover after difficulty."],
  ["Precise","Exact and accurate."],
  ["Eloquent","Able to express ideas clearly and effectively."],
  ["Diligent","Careful and persistent in doing a task."],
  ["Innovative","Introducing new ideas or methods."],
  ["Concise","Brief but clear."],
  ["Empathy","Understanding another person's feelings or perspective."]
];
function showWord() {
  const item = dailyWords[new Date().getDate() % dailyWords.length];
  wordShown = true;
  setGame("Word of the Day", "Build your vocabulary one word at a time.", `<div class="word-card">
    <h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p>
    <p><strong>Example:</strong> Try to use “${escapeHtml(item[0].toLowerCase())}” in a sentence of your own.</p>
    <label for="wordSentence">Your sentence</label><textarea id="wordSentence" rows="3" placeholder="Write a sentence using this word..."></textarea>
    <button type="button" onclick="checkWordSentence()">Save practice</button><p id="wordFeedback" aria-live="polite"></p></div>`);
}
function checkWordSentence() {
  const sentence = ($("wordSentence")?.value || "").trim();
  const feedback = $("wordFeedback");
  if (sentence.split(/\s+/).filter(Boolean).length < 3) {
    if (feedback) feedback.textContent = "Write a complete sentence with at least three words.";
    return;
  }
  quizState.played++; quizState.score += 5;
  if (feedback) feedback.textContent = "Good practice! Check that your sentence uses the word correctly.";
  updateGameStats();
}
function startSentenceGame() {
  const prompts = [
    { prompt: "Rewrite politely: Give me your pen.", sample: "Could you please lend me your pen?" },
    { prompt: "Correct the grammar: He don't like tea.", sample: "He doesn't like tea." },
    { prompt: "Join using 'because': I stayed home. I was ill.", sample: "I stayed home because I was ill." },
    { prompt: "Make this sentence past tense: We play football.", sample: "We played football." }
  ];
  const item = prompts[Math.floor(Math.random() * prompts.length)];
  setGame("Sentence Challenge", "Write your answer, then reveal a sample answer.", `<div class="sentence-game">
    <h3>${escapeHtml(item.prompt)}</h3><textarea id="sentenceAnswer" rows="3" placeholder="Type your answer..."></textarea>
    <button type="button" onclick="revealSentence()">Reveal sample answer</button>
    <p id="sentenceSample" class="hidden">${escapeHtml(item.sample)}</p>
    <button type="button" onclick="startSentenceGame()">New challenge</button></div>`);
}
function revealSentence() {
  const sample = $("sentenceSample");
  if (sample) sample.classList.remove("hidden");
  quizState.played++; updateGameStats();
}
window.startQuiz = startQuiz;
window.answerQuiz = answerQuiz;
window.newScramble = newScramble;
window.checkScramble = checkScramble;
window.showWord = showWord;
window.checkWordSentence = checkWordSentence;
window.startSentenceGame = startSentenceGame;
window.revealSentence = revealSentence;

/* STARTUP */
function init() {
  updateDashboard();
  updateCertificate();
  updateGameStats();
  restoreHistoryButtons();
  if ($("footerYear")) $("footerYear").textContent = new Date().getFullYear();
  const nameInput = $("certificateName") || $("learnerName") || $("certName");
  if (nameInput) {
    nameInput.value = learnerName;
    nameInput.addEventListener("input", () => {
      learnerName = nameInput.value;
      saveValue("piye_name_v1", learnerName);
    });
  }
  renderTopics("basic");
  renderTopics("advanced");
}
document.addEventListener("DOMContentLoaded", init);
