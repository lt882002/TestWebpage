// 题库数据结构示例
let questionBank = [
    {
        id: 1,
        question: "JavaScript中如何声明变量？",
        options: ["var", "let", "const", "以上都是"],
        answer: 3, // 选项索引，从0开始
        explanation: "JavaScript可以使用var、let和const声明变量。"
    },
    // 可以添加更多题目...
];

let currentQuestionIndex = 0;
let userRecords = JSON.parse(localStorage.getItem('quizRecords')) || [];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadQuestion();
    
    // 事件监听
    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
    document.getElementById('next-question').addEventListener('click', nextQuestion);
    document.getElementById('import-questions').addEventListener('click', importQuestions);
    
    loadRecords();
});

// 加载题目
function loadQuestion() {
    if (questionBank.length === 0) {
        document.getElementById('question-text').textContent = "题库为空，请先导入题目";
        document.getElementById('options-container').innerHTML = "";
        document.getElementById('submit-answer').classList.add('hidden');
        return;
    }
    
    const question = questionBank[currentQuestionIndex];
    document.getElementById('question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = "";
    
    question.options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'form-check';
        
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'radio';
        input.name = 'answer';
        input.id = `option-${index}`;
        input.value = index;
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `option-${index}`;
        label.textContent = option;
        
        div.appendChild(input);
        div.appendChild(label);
        optionsContainer.appendChild(div);
    });
    
    document.getElementById('feedback').innerHTML = "";
    document.getElementById('next-question').classList.add('hidden');
    document.getElementById('submit-answer').classList.remove('hidden');
}

// 检查答案
function checkAnswer() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (!selectedOption) {
        alert('请选择一个答案');
        return;
    }
    
    const question = questionBank[currentQuestionIndex];
    const userAnswer = parseInt(selectedOption.value);
    const isCorrect = userAnswer === question.answer;
    
    // 记录结果
    const record = {
        date: new Date().toLocaleString(),
        question: question.question,
        result: isCorrect ? '正确' : '错误',
        userAnswer: question.options[userAnswer],
        correctAnswer: question.options[question.answer],
        explanation: question.explanation
    };
    
    userRecords.push(record);
    localStorage.setItem('quizRecords', JSON.stringify(userRecords));
    
    // 显示反馈
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = `
        <div class="alert ${isCorrect ? 'alert-success' : 'alert-danger'}">
            ${isCorrect ? '回答正确！' : '回答错误！'} 
            正确答案是: ${question.options[question.answer]}<br>
            解析: ${question.explanation}
        </div>
    `;
    
    document.getElementById('submit-answer').classList.add('hidden');
    document.getElementById('next-question').classList.remove('hidden');
}

// 下一题
function nextQuestion() {
    currentQuestionIndex = (currentQuestionIndex + 1) % questionBank.length;
    loadQuestion();
}

// 导入题库
function importQuestions() {
    const fileInput = document.getElementById('question-file');
    const file = fileInput.files[0];
    
    if (!file) {
        document.getElementById('import-status').innerHTML = '<div class="alert alert-warning">请选择文件</div>';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuestions = JSON.parse(e.target.result);
            if (Array.isArray(importedQuestions) && importedQuestions.length > 0) {
                questionBank = importedQuestions;
                currentQuestionIndex = 0;
                localStorage.setItem('questionBank', JSON.stringify(questionBank));
                document.getElementById('import-status').innerHTML = '<div class="alert alert-success">题库导入成功！</div>';
                loadQuestion();
            } else {
                document.getElementById('import-status').innerHTML = '<div class="alert alert-danger">无效的题库格式</div>';
            }
        } catch (error) {
            document.getElementById('import-status').innerHTML = `<div class="alert alert-danger">解析错误: ${error.message}</div>`;
        }
    };
    reader.readAsText(file);
}

// 加载刷题记录
function loadRecords() {
    const recordsTable = document.getElementById('records-table');
    recordsTable.innerHTML = "";
    
    if (userRecords.length === 0) {
        recordsTable.innerHTML = '<tr><td colspan="3">暂无记录</td></tr>';
        return;
    }
    
    // 只显示最近的20条记录
    const recentRecords = userRecords.slice(-20).reverse();
    
    recentRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.question.substring(0, 30)}${record.question.length > 30 ? '...' : ''}</td>
            <td class="${record.result === '正确' ? 'text-success' : 'text-danger'}">${record.result}</td>
        `;
        recordsTable.appendChild(row);
    });
}