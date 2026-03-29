class LiuYaoApp {
    constructor() {
        this.currentStep = 0;
        this.yaoValues = []; // 存储6爻的值
        this.coinResults = []; // 存储每爻的铜钱结果
        this.currentHexagram = null;
        this.paiguaResult = null;
        this.jieguaResult = null;
        
        this.initElements();
        this.initEventListeners();
        this.updateDate();
        this.loadHistory();
    }
    
    initElements() {
        // 获取DOM元素
        this.coinElements = [
            document.getElementById('coin1'),
            document.getElementById('coin2'),
            document.getElementById('coin3')
        ];
        this.coinResultEl = document.getElementById('coinResult');
        this.progressFill = document.getElementById('progressFill');
        this.currentYaoEl = document.getElementById('currentYao');
        this.tossBtn = document.getElementById('tossBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 卦象显示元素
        this.hexagramSection = document.getElementById('hexagramSection');
        this.benGuaNameEl = document.getElementById('benGuaName');
        this.benGuaDisplayEl = document.getElementById('benGuaDisplay');
        this.bianGuaBox = document.getElementById('bianGuaBox');
        this.bianGuaNameEl = document.getElementById('bianGuaName');
        this.bianGuaDisplayEl = document.getElementById('bianGuaDisplay');
        this.changingYaosEl = document.getElementById('changingYaos');
        this.shangGuaEl = document.getElementById('shangGua');
        this.xiaGuaEl = document.getElementById('xiaGua');
        this.changeInfoEl = document.getElementById('changeInfo');
        
        // 排卦表格
        this.paiguaSection = document.getElementById('paiguaSection');
        this.paiguaBody = document.getElementById('paiguaBody');
        
        // 解卦元素
        this.interpretationSection = document.getElementById('interpretationSection');
        this.interpretationContent = document.getElementById('interpretationContent');
        this.questionSelect = document.getElementById('questionSelect');
        
        // 历史记录元素
        this.historySection = document.getElementById('historySection');
        this.historyList = document.getElementById('historyList');
        
        // 导航
        this.navBtns = document.querySelectorAll('.nav-btn');
    }
    
    initEventListeners() {
        this.tossBtn.addEventListener('click', () => this.tossCoins());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // 导航点击
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });
        
        // 问事类型变化
        this.questionSelect.addEventListener('change', () => this.generateInterpretation());
        
        // 添加到桌面提示关闭
        document.getElementById('closePrompt')?.addEventListener('click', () => {
            document.getElementById('installPrompt').style.display = 'none';
        });
    }
    
    updateDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        document.getElementById('dateDisplay').textContent = dateStr;
    }
    
    tossCoins() {
        if (this.currentStep >= 6) return;
        
        // 抛掷动画
        this.coinElements.forEach((coin, index) => {
            coin.textContent = '';
            coin.classList.add('tossing');
            setTimeout(() => {
                const result = Math.random() < 0.6 ? 1 : 0; // 1=阳, 0=阴
                coin.textContent = result === 1 ? '●' : '〇';
                coin.classList.remove('tossing');
                
                // 存储结果
                if (!this.coinResults[this.currentStep]) {
                    this.coinResults[this.currentStep] = [];
                }
                this.coinResults[this.currentStep][index] = result;
            }, index * 300);
        });
        
        // 延迟计算爻
        setTimeout(() => {
            this.calculateYao();
        }, 1000);
    }
    
    calculateYao() {
        const currentToss = this.coinResults[this.currentStep];
        const sum = currentToss.reduce((a, b) => a + b, 0);
        
        let yaoValue;
        let yaoText = '';
        
        if (sum === 3) { // 三个阳
            yaoValue = 9; // 老阳
            yaoText = '老阳 ●●● (变爻)';
        } else if (sum === 2) { // 两阳一阴
            yaoValue = 8; // 少阴
            yaoText = '少阴 ●●〇';
        } else if (sum === 1) { // 一阳两阴
            yaoValue = 7; // 少阳
            yaoText = '少阳 ●〇〇';
        } else { // 三个阴
            yaoValue = 6; // 老阴
            yaoText = '老阴 〇〇〇 (变爻)';
        }
        
        this.yaoValues[this.currentStep] = yaoValue;
        this.coinResultEl.textContent = `第${this.currentStep + 1}爻：${yaoText}`;
        
        this.currentStep++;
        this.updateProgress();
        
        if (this.currentStep === 6) {
            this.generateHexagram();
        }
    }
    
    updateProgress() {
        const progress = (this.currentStep / 6) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.currentYaoEl.textContent = this.currentStep + 1;
        
        if (this.currentStep === 6) {
            this.tossBtn.disabled = true;
            this.tossBtn.textContent = '完成六爻';
            this.resetBtn.disabled = false;
        }
    }
    
    generateHexagram() {
        console.log('=== 开始生成卦象 ===');
        console.log('爻值数组:', this.yaoValues);
        
        // 生成本卦和变卦
        const benGuaBinary = this.yaoValues.map(v => v === 9 ? 1 : v === 7 ? 1 : 0);
        const bianGuaBinary = this.yaoValues.map(v => {
            if (v === 9) return 0; // 老阳变阴
            if (v === 6) return 1; // 老阴变阳
            return v === 7 ? 1 : 0;
        });
        
        // 获取上下卦（注意：上卦是4、5、6爻，下卦是1、2、3爻）
        const shangGuaBinary = benGuaBinary.slice(3, 6).join('');
        const xiaGuaBinary = benGuaBinary.slice(0, 3).join('');
        
        console.log('本卦二进制:', benGuaBinary);
        console.log('上卦二进制(4-6爻):', shangGuaBinary);
        console.log('下卦二进制(1-3爻):', xiaGuaBinary);
        
        // 查找卦名
        const benGuaData = hexagramDatabase.findHexagram(shangGuaBinary, xiaGuaBinary);
        const bianGuaData = hexagramDatabase.findHexagram(
            bianGuaBinary.slice(3, 6).join(''),
            bianGuaBinary.slice(0, 3).join('')
        );
        
        console.log('本卦查找结果:', benGuaData);
        console.log('变卦查找结果:', bianGuaData);
        
        this.currentHexagram = {
            benGua: {
                binary: benGuaBinary,
                shangGua: hexagramDatabase.getGuaName(shangGuaBinary),
                xiaGua: hexagramDatabase.getGuaName(xiaGuaBinary),
                name: benGuaData?.name || '未知',
                number: benGuaData?.number || 0
            },
            bianGua: {
                binary: bianGuaBinary,
                name: bianGuaData?.name || '未知',
                number: bianGuaData?.number || 0
            },
            changingYaos: this.yaoValues.map((v, i) => 
                (v === 6 || v === 9) ? i + 1 : null
            ).filter(i => i !== null),
            yaoValues: [...this.yaoValues] // 保存原始爻值
        };
        
        console.log('生成的卦象对象:', this.currentHexagram);
        
        this.displayHexagram();
        this.showSection('hexagram');
        this.generatePaigua();
    }
    
    displayHexagram() {
        const { benGua, bianGua, changingYaos } = this.currentHexagram;
        
        // 显示本卦
        this.benGuaNameEl.textContent = benGua.name;
        this.shangGuaEl.textContent = benGua.shangGua;
        this.xiaGuaEl.textContent = benGua.xiaGua;
        
        // 绘制本卦
        this.benGuaDisplayEl.innerHTML = '';
        for (let i = 5; i >= 0; i--) {
            const yaoDiv = document.createElement('div');
            yaoDiv.className = 'yao-line';
            yaoDiv.classList.add(benGua.binary[i] === 1 ? 'yao-yang' : 'yao-yin');
            
            if (changingYaos.includes(6 - i)) {
                yaoDiv.classList.add('yao-changing');
            }
            
            this.benGuaDisplayEl.appendChild(yaoDiv);
        }
        
        // 如果有变卦
        if (changingYaos.length > 0) {
            this.bianGuaBox.style.display = 'block';
            this.bianGuaNameEl.textContent = bianGua.name;
            
            // 绘制变卦
            this.bianGuaDisplayEl.innerHTML = '';
            for (let i = 5; i >= 0; i--) {
                const yaoDiv = document.createElement('div');
                yaoDiv.className = 'yao-line';
                yaoDiv.classList.add(bianGua.binary[i] === 1 ? 'yao-yang' : 'yao-yin');
                this.bianGuaDisplayEl.appendChild(yaoDiv);
            }
            
            this.changeInfoEl.textContent = `动爻：第${changingYaos.join('、')}爻`;
        } else {
            this.bianGuaBox.style.display = 'none';
        }
        
        // 显示动爻信息
        if (changingYaos.length > 0) {
            this.changingYaosEl.textContent = `动爻：第${changingYaos.join('、')}爻`;
        } else {
            this.changingYaosEl.textContent = '无动爻（静卦）';
        }
    }
    
    generatePaigua() {
        console.log('=== 开始排卦 ===');
        console.log('传入卦象数据:', this.currentHexagram);
        
        this.paiguaResult = paiguaEngine.generatePaigua(this.currentHexagram);
        
        console.log('排卦引擎返回结果:', this.paiguaResult);
        
        if (this.paiguaResult && this.paiguaResult.yaoData) {
            console.log('爻数据详情:');
            this.paiguaResult.yaoData.forEach((yao, index) => {
                console.log(`爻${index + 1}:`, {
                    位置: yao.position,
                    位置名: yao.positionName,
                    爻象: yao.symbol,
                    地支: yao.dizhi,
                    六亲: yao.liuQin,
                    世应: yao.shiYing,
                    六神: yao.liuShen,
                    是否动爻: yao.isChanging
                });
            });
        }
        
        this.displayPaigua();
        
        // 自动保存到历史记录
        this.saveToHistory();
    }
    
    displayPaigua() {
        if (!this.paiguaResult || !this.paiguaResult.yaoData) {
            console.error('排卦数据不存在或格式错误');
            this.paiguaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">排卦数据加载失败</td></tr>';
            return;
        }
        
        this.paiguaBody.innerHTML = '';
        
        // 从初爻(1)到上爻(6)的顺序显示
        for (let i = 0; i < 6; i++) {
            const yaoData = this.paiguaResult.yaoData[i];
            
            if (!yaoData) {
                console.warn(`第 ${i+1} 爻数据缺失，跳过`);
                continue;
            }
            
            // 获取爻位显示名称
            const positionName = yaoData.positionName || 
                                this.getYaoPositionName(yaoData.position) || 
                                this.getYaoPositionName(i + 1);
            
            // 获取爻象显示文本
            const yaoSymbol = this.getYaoSymbolText(yaoData.isYang, yaoData.isChanging);
            
            // 获取地支（兼容不同属性名）
            const dizhi = yaoData.dizhi || yaoData.diZhi || '未知';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${positionName}</td>
                <td>${yaoSymbol}</td>
                <td>${dizhi}</td>
                <td>${yaoData.liuQin || '未知'}</td>
                <td>${yaoData.shiYing || ''}</td>
                <td>${yaoData.liuShen || '未知'}</td>
                <td>${yaoData.isChanging ? '动' : ''}</td>
            `;
            
            this.paiguaBody.appendChild(row);
        }
    }
    
    // 辅助函数：获取爻位名称
    getYaoPositionName(position) {
        if (!position) return '未知';
        
        const positionNames = {
            1: '初爻',
            2: '二爻', 
            3: '三爻',
            4: '四爻',
            5: '五爻',
            6: '上爻'
        };
        
        return positionNames[position] || `第${position}爻`;
    }
    
    // 辅助函数：获取爻象显示文本
    getYaoSymbolText(isYang, isChanging) {
        if (isYang === undefined || isChanging === undefined) {
            return '未知';
        }
        
        if (isChanging) {
            return isYang ? '老阳 ●' : '老阴 〇';
        }
        return isYang ? '少阳 ●' : '少阴 〇';
    }
    
    generateInterpretation() {
        const questionType = this.questionSelect.value;
        if (!questionType) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先选择问事类型</p>';
            return;
        }
        
        if (!this.currentHexagram || !this.paiguaResult) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先完成排卦</p>';
            return;
        }
        
        this.jieguaResult = jieGuaEngine.generateInterpretation(
            this.currentHexagram,
            this.paiguaResult,
            questionType
        );
        
        this.displayInterpretation();
    }
    
    displayInterpretation() {
        if (!this.jieguaResult) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">解卦数据加载失败</p>';
            return;
        }
        
        let html = `
            <div class="interpretation-item">
                <h4>📊 总体运势</h4>
                <p>${this.jieguaResult.overall || '暂无解读'}</p>
            </div>
            
            <div class="interpretation-item">
                <h4>⚖️ 用神分析</h4>
                <p>${this.jieguaResult.yongShen || '暂无分析'}</p>
            </div>
            
            <div class="interpretation-item">
                <h4>🔄 五行生克</h4>
                <p>${this.jieguaResult.wuXing || '暂无分析'}</p>
            </div>
        `;
        
        if (this.jieguaResult.changingYaos && this.jieguaResult.changingYaos.length > 0) {
            html += `
                <div class="interpretation-item">
                    <h4>🌀 动爻解读</h4>
                    <p>${this.jieguaResult.changingYaoText || '暂无解读'}</p>
                </div>
            `;
        }
        
        if (this.jieguaResult.advice) {
            html += `
                <div class="interpretation-item">
                    <h4>💡 综合建议</h4>
                    <p>${this.jieguaResult.advice}</p>
                </div>
            `;
        }
        
        this.interpretationContent.innerHTML = html;
    }
    
    showSection(sectionName) {
        // 隐藏所有区域
        const sections = ['coin', 'hexagram', 'paigua', 'interpretation', 'history'];
        sections.forEach(section => {
            const sectionEl = document.getElementById(`${section}Section`);
            if (sectionEl) {
                sectionEl.style.display = 'none';
            }
        });
        
        // 显示目标区域
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // 更新导航按钮状态
        this.navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionName) {
                btn.classList.add('active');
            }
        });
        
        // 滚动到顶部
        window.scrollTo(0, 0);
        
        // 如果是解卦区域且没有解卦数据，尝试生成
        if (sectionName === 'interpretation' && !this.jieguaResult && this.paiguaResult) {
            this.generateInterpretation();
        }
    }
    
    reset() {
        this.currentStep = 0;
        this.yaoValues = [];
        this.coinResults = [];
        this.currentHexagram = null;
        this.paiguaResult = null;
        this.jieguaResult = null;
        
        // 重置UI
        this.coinElements.forEach(coin => {
            coin.textContent = '○';
        });
        this.coinResultEl.textContent = '等待抛掷...';
        this.progressFill.style.width = '16.66%';
        this.currentYaoEl.textContent = '1';
        this.tossBtn.disabled = false;
        this.tossBtn.textContent = '抛掷铜钱';
        this.resetBtn.disabled = true;
        
        // 清空卦象显示
        this.benGuaNameEl.textContent = '';
        this.shangGuaEl.textContent = '';
        this.xiaGuaEl.textContent = '';
        this.benGuaDisplayEl.innerHTML = '';
        this.bianGuaBox.style.display = 'none';
        this.changingYaosEl.textContent = '';
        
        // 清空排卦表格
        this.paiguaBody.innerHTML = '';
        
        // 清空解卦内容
        this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先完成排卦并选择问事类型</p>';
        this.questionSelect.value = '';
        
        this.showSection('coin');
    }
    
    saveToHistory() {
        if (!this.currentHexagram || !this.paiguaResult) {
            console.log('无卦象数据，不保存历史记录');
            return;
        }
        
        const record = {
            date: new Date().toISOString(),
            hexagram: this.currentHexagram,
            paigua: this.paiguaResult,
            questionType: this.questionSelect.value || '未指定'
        };
        
        console.log('保存历史记录:', record);
        
        // 存储到IndexedDB
        this.saveRecordToDB(record);
        
        // 更新历史显示
        this.loadHistory();
    }
    
    saveRecordToDB(record) {
        if (!window.indexedDB) {
            console.warn('浏览器不支持IndexedDB，历史记录功能不可用');
            return;
        }
        
        const request = indexedDB.open('LiuYaoDB', 1);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('records')) {
                const objectStore = db.createObjectStore('records', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                // 创建索引以便按日期查询
                objectStore.createIndex('date', 'date', { unique: false });
            }
        };
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const addRequest = store.add(record);
            
            addRequest.onsuccess = () => {
                console.log('历史记录保存成功');
            };
            
            addRequest.onerror = (event) => {
                console.error('保存历史记录失败:', event.target.error);
            };
        };
        
        request.onerror = (e) => {
            console.error('打开数据库失败:', e.target.error);
        };
    }
    
    loadHistory() {
        if (!window.indexedDB || !this.historyList) {
            return;
        }
        
        const request = indexedDB.open('LiuYaoDB', 1);
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('records')) {
                this.displayHistory([]);
                return;
            }
            
            const transaction = db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = (event) => {
                this.displayHistory(event.target.result);
            };
            
            getAllRequest.onerror = (event) => {
                console.error('获取历史记录失败:', event.target.error);
                this.displayHistory([]);
            };
        };
        
        request.onerror = (e) => {
            console.error('打开数据库失败:', e.target.error);
            this.displayHistory([]);
        };
    }
    
    displayHistory(records) {
        if (!this.historyList) return;
        
        if (!records || records.length === 0) {
            this.historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无历史记录</p>';
            return;
        }
        
        // 按时间倒序排列
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.historyList.innerHTML = records.map((record, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-item-date">
                    ${new Date(record.date).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
                <div class="history-item-gua">
                    ${record.hexagram.benGua.name || '未知卦'}
                    ${record.hexagram.changingYaos && record.hexagram.changingYaos.length > 0 ? 
                      ` → ${record.hexagram.bianGua.name || '未知'} (${record.hexagram.changingYaos.length}动爻)` : 
                      ' (静卦)'}
                </div>
                <div class="history-item-question" style="font-size:0.8rem;color:#666;margin-top:5px;">
                    ${record.questionType === 'wealth' ? '问财运' : 
                      record.questionType === 'career' ? '问事业' : 
                      record.questionType === 'relationship' ? '问感情' : 
                      record.questionType === 'health' ? '问健康' : 
                      record.questionType === 'exam' ? '问考试' : 
                      record.questionType === 'others' ? '问其他' : '未指定'}
                </div>
            </div>
        `).join('');
        
        // 添加点击事件
        document.querySelectorAll('.history-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.loadFromHistory(records[index]);
            });
        });
    }
    
    loadFromHistory(record) {
        if (!record || !record.hexagram) {
            console.error('历史记录数据格式错误');
            return;
        }
        
        console.log('加载历史记录:', record);
        
        this.currentHexagram = record.hexagram;
        this.paiguaResult = record.paigua;
        
        // 显示卦象
        this.displayHexagram();
        
        // 显示排卦结果
        if (this.paiguaResult) {
            this.displayPaigua();
        }
        
        // 设置问事类型
        if (record.questionType && this.questionSelect) {
            this.questionSelect.value = record.questionType;
        }
        
        // 生成解卦结果
        if (record.questionType && this.paiguaResult) {
            this.jieguaResult = jieGuaEngine.generateInterpretation(
                this.currentHexagram,
                this.paiguaResult,
                record.questionType
            );
            this.displayInterpretation();
        }
        
        this.showSection('hexagram');
    }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    console.log('六爻算卦应用初始化...');
    
    // 检查必要的全局对象是否存在
    if (typeof hexagramDatabase === 'undefined') {
        console.error('错误: hexagramDatabase 未定义，请确保 hexagram-data.js 已加载');
        alert('数据库加载失败，请刷新页面重试');
        return;
    }
    
    if (typeof paiguaEngine === 'undefined') {
        console.error('错误: paiguaEngine 未定义，请确保 paigua.js 已加载');
        alert('排卦引擎加载失败，请刷新页面重试');
        return;
    }
    
    if (typeof jieGuaEngine === 'undefined') {
        console.error('错误: jieGuaEngine 未定义，请确保 jiegua.js 已加载');
        alert('解卦引擎加载失败，请刷新页面重试');
        return;
    }
    
    try {
        new LiuYaoApp();
        console.log('六爻算卦应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
        alert(`应用初始化失败: ${error.message}`);
    }
});