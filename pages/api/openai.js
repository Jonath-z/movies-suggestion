import { Configuration, OpenAIApi } from "openai";
import { getSystemPrompt, getFunctions } from "../../prompts/promptUtils";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

/**
 * Handle the API request
 * @param {object} req - The HTTP request object
 * @param {object} res - The HTTP response object
 */
export default async function (req, res) {

  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  const userMessage = req.body.payload || "";
  console.log("The userMessage is: ", userMessage);

  try {

    const systemMessage = getSystemPrompt();
    const functions = getFunctions();
    const messages = [systemMessage, userMessage];


    const completion = await openai.createChatCompletion({
      "model": "gpt-3.5-turbo-0613",
      "messages": messages,
      "functions": functions,
      temperature: 1,
      max_tokens: 510,
      top_p: 0,
    });

    const resultContent = completion.data.choices[0].message.function_call.arguments;
    try {
      // console.log("Data from OpenAI API: ", resultContent);
      const cleanedContent = resultContent.replace(/[\r\n]+/g, "");
      const jsonResult = JSON.parse(cleanedContent);
      res.status(200).json({ result: jsonResult });
    } catch (error) {
      res.status(500).json({ error: { message: "Failed to parse JSON response." } });
    }
  } catch (error) {
    if (error.response) {

      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {

      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}
