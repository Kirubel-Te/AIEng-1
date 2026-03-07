import OpenAI from "openai";
import { autoResizeTextarea, checkEnvironment, setLoading, showStream } from "./utils.js";
import {marked} from "marked";
import DOMPurify from "dompurify";
checkEnvironment();

// Initialize an OpenAI client for your provider using env vars
const openai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: process.env.AI_URL,
  dangerouslyAllowBrowser: true,
});

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");

function start() {
  // Setup UI event listeners
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}

// Initialize messages array with system prompt
const messages = [
  {
    role: "system",
    content: `You are the Gift Genie!
    Make your gift suggestions thoughtful and practical.
    Your response must be under 100 words. 
    Skip intros and conclusions. 
    Only output gift suggestions.`,
  },
];

async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();

  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  // Set loading state
  setLoading(true);
  try{
    // Add user message to messages array
    messages.push({ role: "user", content: userPrompt });
    // Send messages to AI and await response
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: messages,
      stream: true, // Enable streaming response
    })

    // stream response
    let fullResponse = "";
    showStream();
    for await (const chunk of response){
      const content = chunk.choices[0].delta?.content;
      if(content){
        fullResponse += content;
        outputContent.innerHTML = DOMPurify.sanitize(marked.parse(fullResponse));
      
      }
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);
    outputContent.innerHTML = "Sorry, something went wrong. Please try again.";
  } finally {
    // Clear loading state
    setLoading(false);
  }
}

start();
