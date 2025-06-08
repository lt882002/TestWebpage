// 初始化变量
let questionBank = [];
let userRecords = [];
let currentQuestionIndex = 0;
let currentUser = null;

// 获取 Firebase 服务
const { db, auth } = window.firebaseServices || {};

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化事件监听
    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
    document.getElementById('next-question').addEventListener('click', nextQuestion);
    document.getElementById('import-questions').addEventListener('click', importQuestions);
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // 初始化 Firebase 认证状态监听
    if (auth) {
        auth.onAuthStateChanged(user => {
            currentUser = user;
            updateAuthUI();
            
            if (user) {
                // 用户已登录，加载数据
                loadQuestionBank();
                loadRecords();
            } else {
                // 用户未登录，清空数据
                questionBank = [];
                userRecords = [];
                currentQuestionIndex = 0;
                loadQuestion(); // 显示空状态
                loadRecords(); // 清空记录显示
            }
        });
    } else {
        console.error("Firebase 服务未正确初始化");
        document.getElementById('auth-status').textContent = "系统错误: 无法初始化服务";
    }
});

// 更新认证状态UI
function updateAuthUI() {
    const authStatus = document.getElementById('auth-status');
    const loginForm = document.getElementById('login-form');
    const userActions = document.getElementById('user-actions');
    
    if (currentUser) {
        authStatus.textContent = `已登录: ${currentUser.email}`;
        authStatus.className = 'text-success';
        loginForm.classList.add('d-none');
        userActions.classList.remove('d-none');
    } else {
        authStatus.textContent = "未登录";
        authStatus.className = 'text-danger';
        loginForm.classList.remove('d-none');
        userActions.classList.add('d-none');
    }
}

// 处理登录
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAlert('请输入邮箱和密码', 'danger');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showAlert('登录成功', 'success');
    } catch (error) {
        console.error("登录失败:", error);
        showAlert(`登录失败: ${error.message}`, 'danger');
    }
}

// 处理注册
async function handleSignup() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAlert('请输入邮箱和密码', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('密码长度至少为6位', 'danger');
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        showAlert('注册成功', 'success');
    } catch (error) {
        console.error("注册失败:", error);
        showAlert(`注册失败: ${error.message}`, 'danger');
    }
}

// 处理退出
async function handleLogout() {
    try {
        await auth.signOut();
        showAlert('已退出登录', 'success');
    } catch (error) {
        console.error("退出失败:", error);
        showAlert(`退出失败: ${error.message}`, 'danger');
    }
}

// 显示提示信息
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-2`;
    alertDiv.textContent = message;
    
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// 加载题库
async function loadQuestionBank() {
    if (!currentUser) return;
    
    try {
        showLoading('question-container', '正在加载题库...');
        
        const snapshot = await db.collection('questionBanks').doc('default').get();
        
        if (snapshot.exists) {
            questionBank = snapshot.data().questions || [];
            currentQuestionIndex = 0;
            loadQuestion();
        } else {
            questionBank = [];
            showAlert('题库为空，请先导入题目', 'info');
            loadQuestion();
        }
    } catch (error) {
        console.error("加载题库失败:", error);
        showAlert('加载题库失败，请刷新重试', 'danger');
    }
}

// 加载题目
function loadQuestion() {
    const questionContainer = document.getElementById('question-container');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackDiv = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-question');
    const submitBtn = document.getElementById('submit-answer');
    
    if (questionBank.length === 0) {
        questionText.textContent = "题库为空，请先导入题目";
        optionsContainer.innerHTML = "";
        submitBtn.classList.add('d-none');
        nextBtn.classList.add('d-none');
        feedbackDiv.innerHTML = "";
        return;
    }
    
    const question = questionBank[currentQuestionIndex];
    questionText.textContent = `${currentQuestionIndex + 1}. ${question.question}`;
    optionsContainer.innerHTML = "";
    
    // 创建选项
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'form-check';
        
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
        
        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        optionsContainer.appendChild(optionDiv);
    });
    
    feedbackDiv.innerHTML = "";
    nextBtn.classList.add('d-none');
    submitBtn.classList.remove('d-none');
}

// 检查答案
async function checkAnswer() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        return;
    }
    
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (!selectedOption) {
        showAlert('请选择一个答案', 'warning');
        return;
    }
    
    const question = questionBank[currentQuestionIndex];
    const userAnswer = parseInt(selectedOption.value);
    const isCorrect = userAnswer === question.answer;
    
    // 创建记录
    const record = {
        questionId: question.id || currentQuestionIndex,
        questionText: question.question,
        userAnswer: question.options[userAnswer],
        correctAnswer: question.options[question.answer],
        isCorrect: isCorrect,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        explanation: question.explanation || ""
    };
    
    try {
        // 保存记录到Firestore
        await db.collection('users').doc(currentUser.uid).collection('records').add(record);
        
        // 更新本地记录
        userRecords.unshift({
            ...record,
            date: new Date().toLocaleString()
        });
        
        // 显示反馈
        showAnswerFeedback(isCorrect, record);
    } catch (error) {
        console.error("保存记录失败:", error);
        showAlert('保存答题记录失败', 'danger');
    }
}

// 显示答案反馈
function showAnswerFeedback(isCorrect, record) {
    const feedbackDiv = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-question');
    const submitBtn = document.getElementById('submit-answer');
    
    feedbackDiv.innerHTML = `
        <div class="alert ${isCorrect ? 'alert-success' : 'alert-danger'}">
            <strong>${isCorrect ? '回答正确!' : '回答错误!'}</strong>
            <p>你的答案: ${record.userAnswer}</p>
            <p>正确答案: ${record.correctAnswer}</p>
            ${record.explanation ? `<p class="mt-2"><strong>解析:</strong> ${record.explanation}</p>` : ''}
        </div>
    `;
    
    submitBtn.classList.add('d-none');
    nextBtn.classList.remove('d-none');
}

// 下一题
function nextQuestion() {
    currentQuestionIndex = (currentQuestionIndex + 1) % questionBank.length;
    loadQuestion();
}

// 导入题库
async function importQuestions() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        return;
    }
    
    const fileInput = document.getElementById('question-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('请选择文件', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedQuestions = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedQuestions) || importedQuestions.length === 0) {
                throw new Error("题库必须是包含至少一个题目的数组");
            }
            
            // 验证题库格式
            const isValid = importedQuestions.every(q => 
                q.question && q.options && Array.isArray(q.options) && q.answer !== undefined
            );
            
            if (!isValid) {
                throw new Error("题库格式不正确，请确保每个题目包含question、options和answer字段");
            }
            
            // 显示加载状态
            showLoading('import-status', '正在导入题库...');
            
            // 保存到Firestore
            await db.collection('questionBanks').doc('default').set({
                questions: importedQuestions,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.uid
            });
            
            // 更新本地题库
            questionBank = importedQuestions;
            currentQuestionIndex = 0;
            
            // 显示成功消息
            document.getElementById('import-status').innerHTML = `
                <div class="alert alert-success">
                    成功导入 ${importedQuestions.length} 道题目！
                </div>
            `;
            
            // 加载第一题
            loadQuestion();
        } catch (error) {
            console.error("导入题库失败:", error);
            document.getElementById('import-status').innerHTML = `
                <div class="alert alert-danger">
                    导入失败: ${error.message}
                </div>
            `;
        }
    };
    reader.readAsText(file);
}

// 加载记录
async function loadRecords() {
    if (!currentUser) {
        document.getElementById('records-table').innerHTML = `
            <tr>
                <td colspan="3" class="text-center">请登录查看答题记录</td>
            </tr>
        `;
        return;
    }
    
    try {
        showLoading('records-table', '正在加载记录...');
        
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('records')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        userRecords = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: data.timestamp ? data.timestamp.toDate().toLocaleString() : '未知时间'
            };
        });
        
        displayRecords();
    } catch (error) {
        console.error("加载记录失败:", error);
        document.getElementById('records-table').innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-danger">加载记录失败</td>
            </tr>
        `;
    }
}

// 显示记录
function displayRecords() {
    const recordsTable = document.getElementById('records-table');
    
    if (userRecords.length === 0) {
        recordsTable.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">暂无答题记录</td>
            </tr>
        `;
        return;
    }
    
    recordsTable.innerHTML = userRecords.map(record => `
        <tr class="${record.isCorrect ? 'table-success' : 'table-danger'}">
            <td>${record.date}</td>
            <td>${record.questionText.substring(0, 30)}${record.questionText.length > 30 ? '...' : ''}</td>
            <td>${record.isCorrect ? '正确' : '错误'}</td>
        </tr>
    `).join('');
}

// 显示加载状态
function showLoading(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center my-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="mt-2">${message}</p>
            </div>
        `;
    }
}