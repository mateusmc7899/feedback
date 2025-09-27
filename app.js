
// ENARE - Sistema de Feedback
class ENARESystem {
    constructor() {
        this.currentView = 'inicio';
        this.currentSubTab = 'historico';
        this.sidebarCollapsed = false;
        
        // Initial data
        this.subjects = [
            { id: 1, nome: "Cardiologia", especialidade: "Clínica", assuntos: ["Arritmias", "Insuficiência Cardíaca", "Coronariopatias", "Hipertensão", "Valvopatias"] },
            { id: 2, nome: "Pneumologia", especialidade: "Clínica", assuntos: ["Asma", "DPOC", "Pneumonias", "Derrame Pleural", "Embolia Pulmonar"] },
            { id: 3, nome: "Gastroenterologia", especialidade: "Clínica", assuntos: ["DRGE", "Úlcera Péptica", "Hepatites", "Cirrose", "Pancreatite"] },
            { id: 4, nome: "Neurologia", especialidade: "Clínica", assuntos: ["AVC", "Epilepsia", "Cefaléias", "Demências", "Parkinson"] },
            { id: 5, nome: "Endocrinologia", especialidade: "Clínica", assuntos: ["Diabetes", "Tireoidopatias", "Obesidade", "Osteoporose", "Adrenal"] },
            { id: 6, nome: "Ortopedia", especialidade: "Cirúrgica", assuntos: ["Fraturas", "Artrose", "Menisco", "LCA", "Coluna"] },
            { id: 7, nome: "Cirurgia Geral", especialidade: "Cirúrgica", assuntos: ["Abdome Agudo", "Hérnias", "Vesícula", "Apendicite", "Trauma"] },
            { id: 8, nome: "Ginecologia", especialidade: "Especialidades", assuntos: ["Câncer Ginecológico", "Endometriose", "SOP", "Climatério", "Sangramento"] },
            { id: 9, nome: "Pediatria", especialidade: "Especialidades", assuntos: ["Crescimento", "Vacinação", "Infecções", "Asma Infantil", "Desenvolvimento"] },
            { id: 10, nome: "Psiquiatria", especialidade: "Especialidades", assuntos: ["Depressão", "Ansiedade", "Transtorno Bipolar", "Esquizofrenia", "Dependência"] }
        ];

        this.spacedRepetition = {
            intervalos_dias: {
                excelente: [1, 3, 7, 14, 30, 60],
                bom: [1, 2, 5, 10, 21, 45],
                regular: [1, 1, 3, 7, 14, 30],
                ruim: [1, 1, 2, 4, 8, 15]
            },
            criterios_performance: {
                excelente: 90,
                bom: 75,
                regular: 60,
                ruim: 0
            }
        };

        this.results = this.loadData('enare_results') || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentDate();
        this.loadSubjects();
        this.updateDashboard();
        this.checkMobileView();
    }

    setupEventListeners() {
        // Sidebar toggle - Fixed to work both ways
        document.getElementById('sidebarToggle').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSidebar();
        });

        // Make logo clickable to go home
        document.querySelector('.sidebar-title').addEventListener('click', () => {
            this.switchView('inicio');
        });

        // Navigation
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Sub navigation
        document.querySelectorAll('.sub-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const subtab = e.currentTarget.dataset.subtab;
                this.switchSubTab(subtab);
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Forms
        document.getElementById('record-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRecordForm();
        });

        document.getElementById('add-subject-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddSubject();
        });

        // Form preview - Fixed event listeners
        document.getElementById('subject-select').addEventListener('change', (e) => {
            this.updateTopicOptions(e.target.value);
            this.updatePreview();
        });

        document.getElementById('correct-answers').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('total-questions').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('topic-select').addEventListener('change', (e) => {
            const customTopicInput = document.getElementById('custom-topic');
            if (e.target.value === 'outro') {
                customTopicInput.classList.remove('hidden');
            } else {
                customTopicInput.classList.add('hidden');
            }
            this.updatePreview();
        });

        document.getElementById('custom-topic').addEventListener('input', () => {
            this.updatePreview();
        });

        // Filters
        const historyFilter = document.getElementById('history-subject-filter');
        if (historyFilter) {
            historyFilter.addEventListener('change', () => {
                this.updateHistoryView();
            });
        }

        const scheduleFilter = document.getElementById('schedule-filter');
        if (scheduleFilter) {
            scheduleFilter.addEventListener('change', () => {
                this.updateScheduleView();
            });
        }

        const subjectSearch = document.getElementById('subject-search');
        if (subjectSearch) {
            subjectSearch.addEventListener('input', () => {
                this.updateSubjectsList();
            });
        }

        const specialtyFilter = document.getElementById('specialty-filter');
        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', () => {
                this.updateSubjectsList();
            });
        }

        // Export/Import
        document.getElementById('export-json').addEventListener('click', () => {
            this.exportData('json');
        });

        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportData('csv');
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-json').click();
        });

        document.getElementById('import-json').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Set default date
        document.getElementById('test-date').valueAsDate = new Date();

        // Window resize
        window.addEventListener('resize', () => {
            this.checkMobileView();
        });

        // Mobile sidebar overlay click
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('open') && 
                !sidebar.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        
        if (window.innerWidth <= 768) {
            // Mobile: toggle open/close
            sidebar.classList.toggle('open');
        } else {
            // Desktop: toggle collapsed/expanded
            sidebar.classList.toggle('collapsed');
            this.sidebarCollapsed = !this.sidebarCollapsed;
        }
    }

    switchView(view) {
        // Update current view
        this.currentView = view;

        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        
        // Show target view
        const targetView = document.getElementById(`${view}-view`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }

        // Update navigation active states
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        // Load view-specific content
        this.loadViewContent(view);

        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    switchSubTab(subtab) {
        this.currentSubTab = subtab;

        // Hide all sub-tabs
        document.querySelectorAll('.sub-tab').forEach(tab => tab.classList.add('hidden'));
        
        // Show target sub-tab
        const targetTab = document.getElementById(`${subtab}-tab`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        }

        // Update sub-nav active states
        document.querySelectorAll('.sub-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.subtab === subtab) {
                item.classList.add('active');
            }
        });

        // Load sub-tab content
        if (subtab === 'historico') this.updateHistoryView();
        if (subtab === 'cronograma') this.updateScheduleView();
        if (subtab === 'estatisticas') this.updateStatisticsView();
    }

    loadViewContent(view) {
        switch(view) {
            case 'inicio':
                this.updateDashboard();
                break;
            case 'estudar':
                this.loadSubjects();
                this.updatePreview(); // Initialize preview
                break;
            case 'acompanhar':
                this.loadHistoryFilters();
                this.updateHistoryView();
                break;
            case 'configurar':
                this.updateSubjectsList();
                break;
        }
    }

    handleQuickAction(action) {
        switch(action) {
            case 'registrar':
                this.switchView('estudar');
                break;
            case 'cronograma':
                this.switchView('acompanhar');
                this.switchSubTab('cronograma');
                break;
            case 'atencao':
                this.showAttentionNeeded();
                break;
        }
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            currentDateElement.textContent = now.toLocaleDateString('pt-BR', options);
        }
    }

    // NEW HELPER FUNCTION TO RELIABLY CREATE A LOCAL DATE OBJECT FROM YYYY-MM-DD STRING
    createLocalDate(dateString) {
        // dateString is in format YYYY-MM-DD (e.g., from date input)
        if (!dateString) return new Date();
        const parts = dateString.split('-').map(p => parseInt(p));
        // new Date(year, monthIndex, day) creates a date in the local timezone, preventing UTC shift errors.
        return new Date(parts[0], parts[1] - 1, parts[2]); 
    }

    loadSubjects() {
        const select = document.getElementById('subject-select');
        const historyFilter = document.getElementById('history-subject-filter');
        
        if (select) {
            // Clear existing options
            select.innerHTML = '<option value="">Selecione uma disciplina...</option>';
            
            this.subjects.forEach(subject => {
                const option = new Option(subject.nome, subject.id);
                select.appendChild(option);
            });
        }

        if (historyFilter) {
            historyFilter.innerHTML = '<option value="">Todas as disciplinas</option>';
            this.subjects.forEach(subject => {
                const option = new Option(subject.nome, subject.id);
                historyFilter.appendChild(option);
            });
        }
    }

    updateTopicOptions(subjectId) {
        const select = document.getElementById('topic-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione um assunto...</option>';

        if (subjectId) {
            const subject = this.subjects.find(s => s.id == subjectId);
            if (subject && subject.assuntos) {
                subject.assuntos.forEach(assunto => {
                    select.appendChild(new Option(assunto, assunto));
                });
            }
        }

        select.appendChild(new Option('Outro...', 'outro'));
    }

    updatePreview() {
        const subjectId = document.getElementById('subject-select').value;
        const correct = parseInt(document.getElementById('correct-answers').value) || 0;
        const total = parseInt(document.getElementById('total-questions').value) || 0;
        const preview = document.getElementById('result-preview');
        if (!preview) return;

        if (!subjectId || total === 0) {
            preview.innerHTML = '<div class="preview-placeholder"><p>Preencha os campos ao lado para ver o preview do resultado</p></div>';
            return;
        }

        if (correct > total) {
            preview.innerHTML = `<div class="preview-placeholder"><p style="color: var(--color-error);">O número de questões certas (${correct}) não pode ser maior que o total (${total}).</p></div>`;
            return;
        }

        const percentage = Math.round((correct / total) * 100);
        const performance = this.getPerformanceLevel(percentage);
        const nextReviewDays = this.calculateNextReview(subjectId, performance);
        
        // FIX: Use createLocalDate for reliable date handling
        let nextReviewDate;
        const testDateInput = document.getElementById('test-date').value;
        if (testDateInput) {
            nextReviewDate = this.createLocalDate(testDateInput);
        } else {
            nextReviewDate = new Date();
        }
        
        nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

        preview.innerHTML = `
            <div class="preview-content">
                <div class="preview-percentage">${percentage}%</div>
                <div class="preview-performance performance-${performance}">${performance.charAt(0).toUpperCase() + performance.slice(1)}</div>
                <div class="preview-next-review">
                    Próxima revisão: ${nextReviewDate.toLocaleDateString('pt-BR')} (${nextReviewDays} dias)
                </div>
            </div>
        `;
    }

    getPerformanceLevel(percentage) {
        const criteria = this.spacedRepetition.criterios_performance;
        if (percentage >= criteria.excelente) return 'excelente';
        if (percentage >= criteria.bom) return 'bom';
        if (percentage >= criteria.regular) return 'regular';
        return 'ruim';
    }

    calculateNextReview(subjectId, performance) {
        const subjectResults = this.results
            .filter(r => r.subjectId == subjectId)
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date to count repetitions

        // Count how many times this subject has been reviewed, or find the last interval index.
        const intervalIndex = subjectResults.length; 
        
        const intervals = this.spacedRepetition.intervalos_dias[performance];
        
        // Return the interval for the current repetition, or the last one if maxed out.
        return intervals[intervalIndex] || intervals[intervals.length - 1] || 30;
    }

    handleRecordForm() {
        const subjectSelect = document.getElementById('subject-select');
        const topicSelect = document.getElementById('topic-select');
        const customTopic = document.getElementById('custom-topic');
        const correctAnswers = document.getElementById('correct-answers');
        const totalQuestions = document.getElementById('total-questions');
        const testDate = document.getElementById('test-date');

        const total = parseInt(totalQuestions.value) || 0;
        const correct = parseInt(correctAnswers.value) || 0;

        const formData = {
            id: Date.now(),
            subjectId: parseInt(subjectSelect.value),
            subjectName: subjectSelect.options[subjectSelect.selectedIndex].text,
            topic: topicSelect.value === 'outro' ? customTopic.value.trim() : topicSelect.value,
            correct: correct,
            total: total,
            percentage: Math.round((correct / total) * 100),
            date: testDate.value, // YYYY-MM-DD string
        };

        if (!formData.subjectId || !formData.total || !formData.topic || formData.topic.length < 1) {
            this.showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (formData.correct > formData.total) {
            this.showToast('O número de questões certas não pode ser maior que o total', 'error');
            return;
        }

        // Calculate performance and next review date
        const performance = this.getPerformanceLevel(formData.percentage);
        const nextReviewDays = this.calculateNextReview(formData.subjectId, performance);
        
        // FIX: Use the new reliable date creator to get the local date
        const nextReviewDate = this.createLocalDate(formData.date);
        
        // Apply the interval
        nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

        // FIX: Extract YYYY-MM-DD from the local date components to prevent timezone shift when saving.
        const year = nextReviewDate.getFullYear();
        const month = String(nextReviewDate.getMonth() + 1).padStart(2, '0');
        const day = String(nextReviewDate.getDate()).padStart(2, '0');

        formData.performance = performance;
        // FIX: Store the date in YYYY-MM-DD format based on local components
        formData.nextReview = `${year}-${month}-${day}`; 

        this.results.push(formData);
        this.saveData('enare_results', this.results);

        this.showToast('Resultado registrado com sucesso!', 'success');
        
        // Reset form and update views
        document.getElementById('record-form').reset();
        document.getElementById('topic-select').innerHTML = '<option value="">Selecione um assunto...</option>';
        document.getElementById('custom-topic').classList.add('hidden');
        document.getElementById('test-date').valueAsDate = new Date();
        this.updatePreview();
        this.updateDashboard();
        this.updateHistoryView();
    }

    updateDashboard() {
        // Stats
        const studiedSubjects = new Set(this.results.map(r => r.subjectId)).size;
        const totalSubjects = this.subjects.length;
        const totalQuestions = this.results.reduce((sum, r) => sum + r.total, 0);
        const totalCorrect = this.results.reduce((sum, r) => sum + r.correct, 0);
        const avgPerformance = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        document.getElementById('total-subjects').textContent = totalSubjects;
        document.getElementById('studied-subjects').textContent = studiedSubjects;
        document.getElementById('avg-performance').textContent = `${avgPerformance}%`;

        // Upcoming Reviews
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString().split('T')[0];

        const upcomingReviews = this.results
            .filter(r => r.nextReview >= todayISO)
            .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));

        document.getElementById('upcoming-reviews').textContent = upcomingReviews.length;
        
        const upcomingList = document.getElementById('upcoming-list');
        if (upcomingList) {
            upcomingList.innerHTML = '';
            if (upcomingReviews.length === 0) {
                upcomingList.innerHTML = '<p class="preview-placeholder">Nenhuma revisão próxima.</p>';
            } else {
                upcomingReviews.slice(0, 5).forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'upcoming-item';
                    
                    // Create local date object from YYYY-MM-DD for display
                    const reviewDateObj = this.createLocalDate(r.nextReview);
                    const date = reviewDateObj.toLocaleDateString('pt-BR');
                    
                    item.innerHTML = `
                        <span class="upcoming-subject">${r.subjectName}</span>
                        <span class="upcoming-date">${r.nextReview === todayISO ? 'HOJE' : date}</span>
                    `;
                    upcomingList.appendChild(item);
                });
            }
        }

        // Charts
        this.renderRecentProgressChart();
    }

    renderRecentProgressChart() {
        const chartElement = document.getElementById('recent-progress-chart');
        if (!chartElement) return;

        // Destroy previous chart instance if it exists
        if (window.recentProgressChart) {
            window.recentProgressChart.destroy();
        }

        // Get last 7 results
        const recentResults = this.results
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-7);

        const labels = recentResults.map(r => {
            // Use createLocalDate for display label
            const dateObj = this.createLocalDate(r.date); 
            return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        });
        const data = recentResults.map(r => r.percentage);

        const ctx = chartElement.getContext('2d');
        window.recentProgressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Performance (%)',
                    data: data,
                    borderColor: 'rgba(var(--color-teal-500-rgb), 1)',
                    backgroundColor: 'rgba(var(--color-teal-500-rgb), 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Performance: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateHistoryView() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        const subjectFilter = document.getElementById('history-subject-filter').value;
        const topicFilter = document.getElementById('history-topic-filter').value.toLowerCase();

        // Sort by date descending
        const filteredResults = this.results
            .filter(r => !subjectFilter || r.subjectId == subjectFilter)
            .filter(r => !topicFilter || r.topic.toLowerCase().includes(topicFilter))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        historyList.innerHTML = '';

        if (filteredResults.length === 0) {
            historyList.innerHTML = '<p class="preview-placeholder">Nenhum resultado encontrado para os filtros selecionados.</p>';
            return;
        }

        filteredResults.forEach(r => {
            const item = document.createElement('div');
            item.className = 'history-item';
            const performanceClass = `performance-${r.performance}`;

            // Use createLocalDate for display date
            const resultDateObj = this.createLocalDate(r.date);
            
            item.innerHTML = `
                <div class="history-info">
                    <div class="history-subject">${r.subjectName}</div>
                    <div class="history-topic">Assunto: ${r.topic}</div>
                    <div class="history-date">Data: ${resultDateObj.toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="history-performance">
                    <div class="history-score">${r.percentage}% (${r.correct}/${r.total})</div>
                    <div class="preview-performance ${performanceClass}">${r.performance.charAt(0).toUpperCase() + r.performance.slice(1)}</div>
                    <button class="history-delete" data-id="${r.id}">Excluir</button>
                </div>
            `;
            historyList.appendChild(item);
        });

        // Add delete listeners
        document.querySelectorAll('.history-delete').forEach(button => {
            button.addEventListener('click', (e) => this.deleteResult(e.target.dataset.id));
        });
    }

    deleteResult(id) {
        if (confirm('Tem certeza que deseja excluir este resultado? Esta ação não pode ser desfeita.')) {
            this.results = this.results.filter(r => r.id != id);
            this.saveData('enare_results', this.results);
            this.showToast('Resultado excluído.', 'info');
            this.updateHistoryView();
            this.updateDashboard();
        }
    }

    updateScheduleView() {
        const scheduleList = document.getElementById('schedule-list');
        if (!scheduleList) return;

        const filter = document.getElementById('schedule-filter').value;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredSchedule = this.results
            .map(r => {
                // FIX: Use createLocalDate to prevent timezone shift on comparison
                const reviewDate = this.createLocalDate(r.nextReview);
                reviewDate.setHours(0, 0, 0, 0);

                const diffDays = Math.ceil((reviewDate - today) / (1000 * 60 * 60 * 24));
                
                let dateClass = 'upcoming';
                let dateLabel = reviewDate.toLocaleDateString('pt-BR');

                if (diffDays < 0) {
                    dateClass = 'past';
                    dateLabel = `${Math.abs(diffDays)} dias atrás`;
                } else if (diffDays === 0) {
                    dateClass = 'today';
                    dateLabel = 'HOJE!';
                } else {
                    dateLabel = `Em ${diffDays} dias`;
                }

                return {
                    ...r,
                    reviewDate,
                    diffDays,
                    dateClass,
                    dateLabel
                };
            })
            .filter(r => {
                if (filter === 'upcoming') return r.diffDays >= 0;
                if (filter === 'past') return r.diffDays < 0;
                if (filter === 'today') return r.diffDays === 0;
                return true; // 'all'
            })
            .sort((a, b) => a.reviewDate - b.reviewDate);

        scheduleList.innerHTML = '';

        if (filteredSchedule.length === 0) {
            scheduleList.innerHTML = '<p class="preview-placeholder">Nenhuma revisão agendada ou correspondente ao filtro.</p>';
            return;
        }

        filteredSchedule.forEach(r => {
            const item = document.createElement('div');
            item.className = 'schedule-item';

            item.innerHTML = `
                <div class="schedule-info">
                    <div class="schedule-subject">${r.subjectName}</div>
                    <div class="schedule-topic">Assunto: ${r.topic}</div>
                </div>
                <div class="schedule-date ${r.dateClass}">
                    ${r.dateLabel}
                </div>
            `;
            scheduleList.appendChild(item);
        });
    }

    updateStatisticsView() {
        const stats = this.calculateSubjectStatistics();
        
        // Render charts
        this.renderSubjectPerformanceChart(stats);
        // retention chart is more complex and would require more data analysis, skipping for brevity
    }

    calculateSubjectStatistics() {
        const subjectStats = {};

        this.results.forEach(r => {
            const subjectId = r.subjectId;
            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    name: r.subjectName,
                    totalAttempts: 0,
                    totalQuestions: 0,
                    totalCorrect: 0,
                    performanceSum: 0,
                    lastDate: null
                };
            }

            const stat = subjectStats[subjectId];
            stat.totalAttempts++;
            stat.totalQuestions += r.total;
            stat.totalCorrect += r.correct;
            stat.performanceSum += r.percentage;
            
            // Use createLocalDate for comparison
            const currentDate = this.createLocalDate(r.date);
            if (!stat.lastDate || currentDate > stat.lastDate) {
                stat.lastDate = currentDate;
            }
        });

        // Calculate average performance
        Object.values(subjectStats).forEach(stat => {
            stat.avgPerformance = stat.totalQuestions > 0 ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100) : 0;
        });

        return Object.values(subjectStats).sort((a, b) => b.avgPerformance - a.avgPerformance);
    }

    renderSubjectPerformanceChart(stats) {
        const chartElement = document.getElementById('subject-performance-chart');
        if (!chartElement) return;

        if (window.subjectPerformanceChart) {
            window.subjectPerformanceChart.destroy();
        }

        const labels = stats.map(s => s.name);
        const data = stats.map(s => s.avgPerformance);
        const backgroundColors = data.map(p => {
            if (p >= 90) return `rgba(${this.getRGB('success')}, 0.6)`;
            if (p >= 75) return `rgba(${this.getRGB('teal-500')}, 0.6)`;
            if (p >= 60) return `rgba(${this.getRGB('warning')}, 0.6)`;
            return `rgba(${this.getRGB('error')}, 0.6)`;
        });

        const ctx = chartElement.getContext('2d');
        window.subjectPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Performance Média (%)',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(c => c.replace('0.6', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Média: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    renderRetentionChart() {
        // Implementation for a complex retention chart (e.g., performance over time or interval)
        // This is a placeholder as the logic requires more state and complex chart setup
        const chartElement = document.getElementById('retention-chart');
        if (!chartElement) return;

        const ctx = chartElement.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Dia 1', 'Dia 7', 'Dia 30', 'Dia 60'],
                datasets: [{
                    label: 'Retenção Média (%)',
                    data: [85, 70, 55, 40], // Placeholder data
                    borderColor: 'rgba(var(--color-primary-rgb), 1)',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });
    }

    getRGB(colorName) {
        // Helper to get RGB values from CSS variables
        const rootStyle = getComputedStyle(document.documentElement);
        const varName = `--color-${colorName}-rgb`;
        return rootStyle.getPropertyValue(varName).trim() || '33, 128, 141'; // Default to teal
    }

    showAttentionNeeded() {
        const attentionList = this.calculateSubjectStatistics()
            .filter(s => s.avgPerformance > 0 && s.avgPerformance < 75); // Subjects with low/regular performance
        
        if (attentionList.length === 0) {
            this.showToast('Nenhuma disciplina precisa de atenção urgente. Bom trabalho!', 'success');
            return;
        }

        const subjectNames = attentionList.map(s => `${s.name} (${s.avgPerformance}%)`).join(', ');
        this.showToast(`Disciplinas que precisam de atenção: ${subjectNames}`, 'warning');
    }

    // Configurar View Logic

    updateSubjectsList() {
        const listContainer = document.getElementById('subjects-list');
        if (!listContainer) return;
        
        const search = document.getElementById('subject-search').value.toLowerCase();
        const specialtyFilter = document.getElementById('specialty-filter').value;

        const filteredSubjects = this.subjects
            .filter(s => !search || s.nome.toLowerCase().includes(search))
            .filter(s => !specialtyFilter || s.especialidade === specialtyFilter);

        listContainer.innerHTML = '';

        if (filteredSubjects.length === 0) {
            listContainer.innerHTML = '<p class="preview-placeholder">Nenhuma disciplina encontrada.</p>';
            return;
        }

        filteredSubjects.forEach(s => {
            const item = document.createElement('div');
            item.className = 'subject-item';

            item.innerHTML = `
                <div class="subject-details">
                    <div class="subject-name">${s.nome}</div>
                    <div class="subject-specialty">Especialidade: ${s.especialidade}</div>
                    <div class="subject-topics">Assuntos: ${s.assuntos.join(', ')}</div>
                </div>
                <div class="subject-actions">
                    <button class="subject-delete-btn" data-id="${s.id}">
                        <span class="nav-icon">🗑️</span>
                    </button>
                    </div>
            `;
            listContainer.appendChild(item);
        });

        document.querySelectorAll('.subject-delete-btn').forEach(button => {
            button.addEventListener('click', (e) => this.deleteSubject(e.currentTarget.dataset.id));
        });
    }

    handleAddSubject() {
        const nameInput = document.getElementById('new-subject-name');
        const specialtySelect = document.getElementById('new-subject-specialty');
        const topicsInput = document.getElementById('new-subject-topics');

        const name = nameInput.value.trim();
        const specialty = specialtySelect.value;
        const topics = topicsInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0);

        if (!name || !specialty) {
            this.showToast('Preencha o nome e a especialidade da disciplina.', 'error');
            return;
        }

        const newId = this.subjects.length > 0 ? Math.max(...this.subjects.map(s => s.id)) + 1 : 1;

        const newSubject = {
            id: newId,
            nome: name,
            especialidade: specialty,
            assuntos: topics
        };

        this.subjects.push(newSubject);
        this.saveData('enare_subjects', this.subjects); // Assuming you want to save custom subjects

        this.showToast(`Disciplina "${name}" adicionada!`, 'success');
        
        // Reset form and update views
        document.getElementById('add-subject-form').reset();
        this.updateSubjectsList();
        this.loadSubjects();
    }

    deleteSubject(id) {
        if (confirm('Tem certeza que deseja excluir esta disciplina? Isso não removerá resultados históricos, mas impedirá novos registros.')) {
            this.subjects = this.subjects.filter(s => s.id != id);
            this.saveData('enare_subjects', this.subjects);
            this.showToast('Disciplina excluída.', 'info');
            this.updateSubjectsList();
            this.loadSubjects(); // Update select options
        }
    }

    // Data Management
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            // Load custom subjects if available, otherwise use default list
            if (key === 'enare_subjects' && data) {
                 // To allow the user to modify the default list, we load the saved one
                 return data ? JSON.parse(data) : this.subjects;
            }
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    exportData(format) {
        const data = {
            subjects: this.subjects,
            results: this.results
        };
        const filename = `enare_backup_${new Date().toISOString().split('T')[0]}`;
        
        if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            this.downloadFile(json, `${filename}.json`, 'application/json');
            this.showToast('Backup JSON exportado.', 'success');
        } else if (format === 'csv') {
            const csv = this.convertToCSV(this.results);
            this.downloadFile(csv, `${filename}.csv`, 'text/csv');
            this.showToast('Backup CSV exportado. (Apenas resultados)', 'success');
        }
    }

    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
        ].join('\n');
        return csv;
    }

    importData(file) {
        if (!file) {
            this.showToast('Nenhum arquivo selecionado.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.results) {
                    this.results = data.results;
                    this.saveData('enare_results', this.results);
                }

                if (data.subjects) {
                    this.subjects = data.subjects;
                    this.saveData('enare_subjects', this.subjects);
                    this.loadSubjects();
                    this.updateSubjectsList();
                }
                
                this.updateDashboard();
                this.updateHistoryView();
                this.updateScheduleView();

                this.showToast('Dados importados e carregados com sucesso!', 'success');
            } catch (error) {
                this.showToast('Erro ao processar o arquivo. Certifique-se de que é um JSON válido.', 'error');
                console.error('Import Error:', error);
            }
        };
        reader.readAsText(file);
    }

    checkMobileView() {
        const isMobile = window.innerWidth <= 768;
        const body = document.body;
        
        if (isMobile) {
            // Ensure sidebar starts closed on mobile
            document.getElementById('sidebar').classList.remove('collapsed');
            if (document.getElementById('sidebar').classList.contains('open')) {
                // If it was explicitly opened, keep it that way, but remove desktop style
                document.getElementById('sidebar').classList.remove('collapsed');
            }
        } else {
            // Re-apply desktop collapsed state if it was set
            if (this.sidebarCollapsed) {
                document.getElementById('sidebar').classList.add('collapsed');
            }
            // Ensure mobile open state is removed
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enareSystem = new ENARESystem();
});
    