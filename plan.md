# Function

Create a trainer web application that trains baristas to accurately capture customer orders in a coffee shop, like Starbucks, by simulating customer interactions.

## Customers can

- speak to the barista and place their orders using natural language.
- have a wide range of preferences and dietary restrictions.
- customize their orders with various options and modifications.
- be from different age groups and demographics
- have different personalities and communication styles.
- have emotions and moods that can affect their interactions with the barista.
- (some) be hard to please and may have high expectations for their coffee and pastries.

## Baristas should

- type the customer's order into the system and process it accurately and efficiently.

## The application should

- Create a comprehensive menu of coffee and pastry options, including various customization options and modifications.
- Use Gemini API to generate realistic customer profiles, including their preferences, dietary restrictions, and communication styles.
- Use Gemini API to generate realistic customer orders based on their profiles and preferences.
- Use Gemini-TTS to simulate customer speech and allow baristas to practice listening and understanding spoken orders.
- show a "Next Customer" button to start a new interaction with a different customer profile and order.
- show a "Check" button to check the answer and provide feedback.
- show a "Replay" button to replay the customer's speech for the barista to listen again.
- Use a text-based interface for baristas to input orders
- Provide feedback on the accuracy of the barista's order input, highlighting any discrepancies between the customer's spoken order and the barista's input.
- Track the barista's performance over time, allowing them to see their progress and identify areas for improvement.
- Include a variety of customer profiles and orders to ensure that baristas are exposed to a wide range of scenarios and can develop their skills in handling different types of customers and orders.

## Implementation

- Use standalone next.js for both frontend and backend development.
- Use Typescript for coding.
- Use Tailwind CSS for styling.
- Use Gemini API with provided key in .env.local (GEMINI_API_KEY=AIzaSyDEY2maBBd5INlX3-CtAWIIco3A32l8ZNM)
- Use gemini-2.5-flash-tts for text-to-speech functionality.
- Use gemini-2.5-flash for generating customer profiles and orders.
- Collect barista performance data in a local json file.

## Reference

![this is just a reference](reference.html)
