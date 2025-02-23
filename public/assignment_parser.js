let correctAnswers = {};
let mathFieldMap = new Map();

document.getElementById('file').onchange = function() {
  var file = this.files[0];

  var reader = new FileReader();
  reader.onload = function(progressEvent) {
    const text = this.result;

    var sections = text.split('<section>');

    var outputHTML = '';

    for (var i = 1; i < sections.length; i++) {
      var section = sections[i];
      var endIndex = section.indexOf('</section>');
      var sectionContent = section.substring(0, endIndex).trim();

      var variables = {};

      var lines = sectionContent.split('\n');
      for (var line = 0; line < lines.length; line++) {
        var currentLine = lines[line].trim();
        if (currentLine.startsWith('int ')) {
          var variableName = currentLine.substring(4, currentLine.indexOf('=')).trim();
          var variableValue = evaluateVariable(currentLine.substring(currentLine.indexOf('=') + 1).trim(), variables);
          variables[variableName] = variableValue;
        }
      }

      var sectionTitleIndex = sectionContent.indexOf('section-title:');
      var sectionTitle = '';
      if (sectionTitleIndex !== -1) {
        var titleEndIndex = sectionContent.indexOf('\n', sectionTitleIndex);
        sectionTitle = sectionContent.substring(sectionTitleIndex + 14, titleEndIndex).trim();
      }

      var questions = sectionContent.split('<question>');
      var questionsHTML = '';

      for (var j = 1; j < questions.length; j++) {
        var question = questions[j];
        var endQuestionIndex = question.indexOf('</question>');
        var questionContent = question.substring(0, endQuestionIndex).trim();

        var textIndex = questionContent.indexOf('text:');
        var correctAnswerIndex = questionContent.indexOf('correct-answer:');

        var textValue = questionContent.substring(textIndex + 5, correctAnswerIndex).trim();

        var correctAnswer = '';
        if (correctAnswerIndex !== -1) {
          correctAnswer = questionContent.substring(correctAnswerIndex + 15).trim();
          correctAnswer = evaluateAndSimplifyExpression(correctAnswer, variables);
        }

        textValue = replaceVariables(textValue, variables);

        textValue = textValue.replace(/\$(.*?)(?<! )\$/g, function(match, latexContent) {
          return '<span class="mathquill-noneditable">' + latexContent.trim() + '</span>';
        });

        var uniqueQuestionId = i + '-' + (j - 1);
        var answerField = findAnswerField(sectionContent, j - 1);
        var answerHTML = generateAnswerHTML(answerField, variables, uniqueQuestionId);

        correctAnswers[uniqueQuestionId] = correctAnswer;

        var checkButtonHTML = generateCheckButtonHTML(uniqueQuestionId);

        questionsHTML += '<p>' + textValue + '</p>' + answerHTML + checkButtonHTML;
      }

      var sectionHTML = '<div class="subpage">' +
                        '<h3>' + sectionTitle + '</h3>' +
                        questionsHTML +
                        '</div>';

      outputHTML += sectionHTML;
    }

    document.getElementById('output').innerHTML = outputHTML;

    initializeMathQuillFields();
  };

  reader.readAsText(file);
};

function evaluateVariable(expression, variables) {
  expression = expression.replace(/\s+/g, '');

  if (expression.startsWith('int.random[') && expression.endsWith(']')) {
    var options = expression.substring(expression.indexOf('[') + 1, expression.lastIndexOf(']')).split(',');
    options = options.map(option => parseInt(option.trim()));
    var randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }
  else if (expression.startsWith('int.random')) {
    var args = expression.substring(expression.indexOf('(') + 1, expression.indexOf(')')).split(',');
    var min = parseInt(args[0].trim());
    var max = parseInt(args[1].trim());
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  if (expression.includes("{") && expression.includes("}")) {
    expression = expression.replace(/\{(.*?)\}/g, function(match, variableName) {
      var variableValue = variables[variableName.trim()];
      if (variableValue !== undefined) {
        return variableValue.toString();
      } else {
        return match;
      }
    });

    return evaluateVariable(expression, variables);
  }

  expression = evaluateAndSimplifyExpression(expression, variables);

  return expression;
}

function replaceVariables(text, variables) {
  return text.replace(/\{\{(.*?)\}\}/g, function(match, variableName) {
    return '{' + (variables[variableName.trim()] || match) + '}'
  }).replace(/\{(.*?)\}/g, function(match, variableName) {
    return variables[variableName.trim()] || match;
  });
}

function evaluateAndSimplifyExpression(expression, variables) {
  expression = replaceVariables(expression, variables);

  try {
    return math.evaluate(expression);
  } catch (error) {
    return expression;
  }
}

function generateAnswerHTML(answerField, variables, uniqueQuestionId) {
  var typeIndex = answerField.indexOf('type:');
  var typeValue = answerField.substring(typeIndex + 5).trim();

  if (typeValue.startsWith('raw-text')) {
    // code
  } if (typeValue.startsWith('math-text')) {
    return '<div class="mathquill-container"><span id="answer-' + uniqueQuestionId + '" class="mathquill-editable mq-editable-field"></span></div>';
  } else if (typeValue.startsWith('multiple-choice')) {
    var optionsStartIndex = typeValue.indexOf('[') + 1;
    var optionsEndIndex = typeValue.indexOf(']');
    var optionsString = typeValue.substring(optionsStartIndex, optionsEndIndex);
    var options = optionsString.split(',').map(option => evaluateAndSimplifyExpression(option.trim(), variables));

    var randomizeIndex = typeValue.indexOf('randomize=true');
    if (randomizeIndex !== -1) {
      options = shuffleArray(options);
    }

    var choicesHTML = options.map(option => {
      if (typeof option === 'string') {
        var parts = option.split('$');
        var renderedOption = parts.map((part, index) => {
          if (index % 2 === 1) {
            return '<span class="mathquill-noneditable">' + part + '</span>';
          } else {
            return part;
          }
        }).join('');
        return '<input type="radio" name="multiple-choice-' + uniqueQuestionId + '" id="option-' + uniqueQuestionId + '-' + option + '">' + 
               '<label for="option-' + uniqueQuestionId + '-' + option + '">' + renderedOption + '</label>';
      } else {
        return '<input type="radio" name="multiple-choice-' + uniqueQuestionId + '" id="option-' + uniqueQuestionId + '-' + option + '">' + 
               '<label for="option-' + uniqueQuestionId + '-' + option + '">' + option + '</label>';
      }
    }).join('<br>');

    return '<div>' + choicesHTML + '</div>';
  }
  return '';
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function findAnswerField(sectionContent, questionId) {
  var answerFieldRegex = new RegExp('<answer-field>\\s*id: ' + questionId + '.*?<\\/answer-field>', 's');
  var match = sectionContent.match(answerFieldRegex);
  if (match) {
    return match[0];
  }
  return null;
}

function generateCheckButtonHTML(uniqueQuestionId) {
  return '<button type="button" class="button" style="background-color:rgb(2, 168, 245); font-size:15px; \
  padding: calc(.875rem - 5px) calc(1.5rem - 5px); min-height: 0rem; margin-top: \
  4px; margin-bottom: 6px;"\ id="check-button-' + uniqueQuestionId + '">Check Answer</button>';
}

function initializeMathQuillFields() {
  var MQ = MathQuill.getInterface(2);
  document.querySelectorAll('.mathquill-editable').forEach(function(field) {
    var mathField = MQ.MathField(field, {
      spaceBehavesLikeTab: true,
      handlers: {
        edit: function() {
          var enteredMath = mathField.latex();
        }
      }
    });
    mathFieldMap.set(field.id, mathField);
  });

  document.querySelectorAll('.mathquill-noneditable').forEach(function(field) {
    MQ.StaticMath(field);
  });

  document.querySelectorAll('button[id^="check-button-"]').forEach(function(button) {
    button.addEventListener('click', function() {
      var uniqueQuestionId = this.id.split('-').slice(2).join('-');
      checkAnswer(uniqueQuestionId);
    });
  });
}

function checkAnswer(uniqueQuestionId) {
  var answerType = document.querySelector('input[name="multiple-choice-' + uniqueQuestionId + '"]') ? 'multiple-choice' : 'math-text';

  if (answerType === 'multiple-choice') {
    var correctAnswer = correctAnswers[uniqueQuestionId];
    var selectedAnswer = document.querySelector('input[name="multiple-choice-' + uniqueQuestionId + '"]:checked');

    if (selectedAnswer) {
      var selectedAnswerValue = selectedAnswer.id.replace(/^option-\d+-\d+-/, '');

      if (selectedAnswerValue === correctAnswer.toString()) {
        alert('Correct!');
      } else {
        alert('Incorrect. Please select the correct answer.');
      }
    } else {
      alert('Please select an answer.');
    }
  } else if (answerType === 'math-text') {
    var correctAnswer = correctAnswers[uniqueQuestionId];
    var mathField = mathFieldMap.get('answer-' + uniqueQuestionId);

    if (mathField) {
      var enteredAnswer;
      try {
        enteredAnswer = mathField.latex();
      } catch (error) {
        console.error('Error accessing latex method:', error);
        alert('Error accessing the answer field.');
        return;
      }

      if (enteredAnswer === correctAnswer.toString()) {
        alert('Correct!');
      } else {
        alert('Incorrect. Please enter the correct answer.');
      }
    } else {
      alert('MathQuill field not found.');
    }
  }
}
