export async function callGemini(prompt: string, jsonMode: boolean = false): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.warn("No GEMINI_API_KEY, GEMINI_KEY, or GOOGLE_API_KEY found in environment variables.");
        throw new Error("Gemini API key is not configured.");
    }

    // Default to gemini-1.5-flash for reliability and speed
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body: any = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    if (jsonMode) {
        body.generationConfig = {
            responseMimeType: "application/json"
        };
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
        throw new Error("Invalid response structure from Gemini API");
    }

    return resultText;
}
