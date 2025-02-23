document.getElementById('generate-quiz').addEventListener('click', async () => {
    const promptText = document.getElementById('quiz-prompt').value;
    const button = document.getElementById('generate-quiz');
    const originalText = button.textContent;

    if (!promptText.trim()) {
        alert('Please enter some content to generate a quiz from.');
        return;
    }

    try {
        button.textContent = 'Generating...';
        button.disabled = true;

        const response = await fetch('http://localhost:3000/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ promptText })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server request failed: ${response.status}`);
        }
        
        const blob = new Blob([data.quizContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_quiz.sga';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        button.textContent = originalText;
        button.disabled = false;

        alert('Quiz generated and downloaded successfully!');

    } catch (error) {
        console.error('Error generating quiz:', error);
        alert(error.message || 'Error generating quiz. Please check the console for details.');
        
        button.textContent = originalText;
        button.disabled = false;
    }
});
