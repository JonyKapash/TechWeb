import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function translateAndSummarize(
  title: string,
  content: string,
  maxLength: number = 200
) {
  try {
    const prompt = `
      Please translate and summarize the following English tech article into Hebrew.
      Keep the summary concise but informative, maintaining the key points and technical accuracy.
      Maximum length: ${maxLength} characters.

      Title: ${title}
      Content: ${content}

      Format the response as:
      Title: [Hebrew Title]
      Summary: [Hebrew Summary]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator and tech journalist, skilled in translating and summarizing English tech articles into Hebrew while maintaining technical accuracy and journalistic quality.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No translation generated");
    }

    // Parse the response
    const titleMatch = result.match(/Title: (.+)/);
    const summaryMatch = result.match(/Summary: (.+)/s);

    return {
      hebrewTitle: titleMatch?.[1] || "",
      hebrewSummary: summaryMatch?.[1] || "",
    };
  } catch (error) {
    console.error("Error in translation and summarization:", error);
    throw new Error("Failed to translate and summarize the article");
  }
}

export async function summarizeEnglish(
  content: string,
  maxLength: number = 150
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a tech journalist who excels at creating concise, informative summaries of tech articles while maintaining technical accuracy.",
        },
        {
          role: "user",
          content: `Please summarize the following tech article in ${maxLength} characters or less, focusing on the key points and maintaining technical accuracy:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content;
    if (!summary) {
      throw new Error("No summary generated");
    }

    return summary;
  } catch (error) {
    console.error("Error in summarization:", error);
    throw new Error("Failed to summarize the article");
  }
}
