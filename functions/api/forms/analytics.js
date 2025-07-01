/**
 * Form Analytics API Endpoint
 * Provides comprehensive analytics and reporting for form submissions
 * 
 * Features:
 * - Submission statistics and trends
 * - Field completion analysis
 * - Response data insights
 * - Export capabilities (CSV, JSON)
 * - Date range filtering
 * - Template-specific analytics
 */

import { requireAuth, addCorsHeaders, handleCors } from '../../auth/middleware.js';

export async function onRequest(context) {
    const { request, env } = context;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return handleCors();
    }

    try {
        const method = request.method;
        const url = new URL(request.url);
        
        switch (method) {
            case 'GET':
                return await getAnalytics(request, env, url);
            default:
                return addCorsHeaders(new Response(JSON.stringify({
                    success: false,
                    message: 'Method not allowed'
                }), {
                    status: 405,
                    headers: { 'Content-Type': 'application/json' }
                }));
        }
        
    } catch (error) {
        console.error('Analytics API error:', error);
        return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            message: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
}

/**
 * Get form analytics and statistics
 */
async function getAnalytics(request, env, url) {
    // Authenticate user
    const authResult = await requireAuth(request, env);
    if (!authResult.success) {
        return addCorsHeaders(new Response(JSON.stringify(authResult), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
    
    const userId = authResult.data.userId;
    const params = url.searchParams;
    
    // Parse query parameters
    const templateId = params.get('template_id');
    const startDate = params.get('start_date');
    const endDate = params.get('end_date');
    const format = params.get('format') || 'json'; // json or csv
    const type = params.get('type') || 'overview'; // overview, trends, fields, export
    
    try {
        let analyticsData;
        
        switch (type) {
            case 'overview':
                analyticsData = await getOverviewAnalytics(env, userId, templateId, startDate, endDate);
                break;
            case 'trends':
                analyticsData = await getTrendsAnalytics(env, userId, templateId, startDate, endDate);
                break;
            case 'fields':
                analyticsData = await getFieldAnalytics(env, userId, templateId, startDate, endDate);
                break;
            case 'export':
                return await exportData(env, userId, templateId, startDate, endDate, format);
            default:
                analyticsData = await getOverviewAnalytics(env, userId, templateId, startDate, endDate);
        }
        
        return addCorsHeaders(new Response(JSON.stringify({
            success: true,
            data: analyticsData
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        
    } catch (error) {
        console.error('Analytics query error:', error);
        return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            message: 'Failed to retrieve analytics data'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
}

/**
 * Get overview analytics including total submissions, form counts, etc.
 */
async function getOverviewAnalytics(env, userId, templateId, startDate, endDate) {
    const dateFilter = buildDateFilter(startDate, endDate);
    const templateFilter = templateId ? `AND ft.id = ?` : '';
    
    // Get basic statistics
    const statsQuery = `
        SELECT 
            COUNT(DISTINCT ft.id) as total_forms,
            COUNT(fs.id) as total_submissions,
            AVG(CASE WHEN fs.submitted_at IS NOT NULL THEN 1 ELSE 0 END) as avg_completion_rate,
            MIN(fs.submitted_at) as first_submission,
            MAX(fs.submitted_at) as latest_submission
        FROM form_templates ft
        LEFT JOIN form_submissions fs ON ft.id = fs.template_id ${dateFilter}
        WHERE ft.created_by = ? ${templateFilter}
    `;
    
    const statsParams = [userId];
    if (templateId) statsParams.push(templateId);
    
    const statsResult = await env.DB.prepare(statsQuery).bind(...statsParams).first();
    
    // Get form-specific statistics
    const formsQuery = `
        SELECT 
            ft.id,
            ft.name,
            ft.description,
            ft.created_at,
            COUNT(fs.id) as submission_count,
            MAX(fs.submitted_at) as last_submission
        FROM form_templates ft
        LEFT JOIN form_submissions fs ON ft.id = fs.template_id ${dateFilter}
        WHERE ft.created_by = ? ${templateFilter}
        GROUP BY ft.id, ft.name, ft.description, ft.created_at
        ORDER BY submission_count DESC
        LIMIT 10
    `;
    
    const formsParams = [userId];
    if (templateId) formsParams.push(templateId);
    
    const formsResults = await env.DB.prepare(formsQuery).bind(...formsParams).all();
    
    // Get recent submissions
    const recentQuery = `
        SELECT 
            fs.id,
            fs.submitted_at,
            ft.name as form_name,
            ft.id as template_id
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        ORDER BY fs.submitted_at DESC
        LIMIT 10
    `;
    
    const recentParams = [userId];
    if (templateId) recentParams.push(templateId);
    
    const recentResults = await env.DB.prepare(recentQuery).bind(...recentParams).all();
    
    return {
        overview: {
            total_forms: statsResult.total_forms || 0,
            total_submissions: statsResult.total_submissions || 0,
            avg_completion_rate: Math.round((statsResult.avg_completion_rate || 0) * 100),
            first_submission: statsResult.first_submission,
            latest_submission: statsResult.latest_submission
        },
        top_forms: formsResults.results || [],
        recent_submissions: recentResults.results || []
    };
}

/**
 * Get trends analytics showing submission patterns over time
 */
async function getTrendsAnalytics(env, userId, templateId, startDate, endDate) {
    const dateFilter = buildDateFilter(startDate, endDate);
    const templateFilter = templateId ? `AND ft.id = ?` : '';
    
    // Daily submission trends
    const dailyQuery = `
        SELECT 
            DATE(fs.submitted_at) as date,
            COUNT(fs.id) as submissions
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        GROUP BY DATE(fs.submitted_at)
        ORDER BY date DESC
        LIMIT 30
    `;
    
    const dailyParams = [userId];
    if (templateId) dailyParams.push(templateId);
    
    const dailyResults = await env.DB.prepare(dailyQuery).bind(...dailyParams).all();
    
    // Hourly submission patterns
    const hourlyQuery = `
        SELECT 
            CAST(strftime('%H', fs.submitted_at) AS INTEGER) as hour,
            COUNT(fs.id) as submissions
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        GROUP BY hour
        ORDER BY hour
    `;
    
    const hourlyParams = [userId];
    if (templateId) hourlyParams.push(templateId);
    
    const hourlyResults = await env.DB.prepare(hourlyQuery).bind(...hourlyParams).all();
    
    // Weekly submission patterns
    const weeklyQuery = `
        SELECT 
            CAST(strftime('%w', fs.submitted_at) AS INTEGER) as day_of_week,
            COUNT(fs.id) as submissions
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        GROUP BY day_of_week
        ORDER BY day_of_week
    `;
    
    const weeklyParams = [userId];
    if (templateId) weeklyParams.push(templateId);
    
    const weeklyResults = await env.DB.prepare(weeklyQuery).bind(...weeklyParams).all();
    
    // Map day numbers to names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = weeklyResults.results?.map(row => ({
        day: dayNames[row.day_of_week],
        day_number: row.day_of_week,
        submissions: row.submissions
    })) || [];
    
    return {
        daily_trends: dailyResults.results || [],
        hourly_patterns: hourlyResults.results || [],
        weekly_patterns: weeklyData
    };
}

/**
 * Get field-level analytics for form completion rates
 */
async function getFieldAnalytics(env, userId, templateId, startDate, endDate) {
    if (!templateId) {
        throw new Error('Template ID is required for field analytics');
    }
    
    const dateFilter = buildDateFilter(startDate, endDate);
    
    // Get template schema
    const templateQuery = `
        SELECT form_schema FROM form_templates 
        WHERE id = ? AND created_by = ?
    `;
    
    const template = await env.DB.prepare(templateQuery).bind(templateId, userId).first();
    
    if (!template) {
        throw new Error('Template not found');
    }
    
    let formSchema;
    try {
        formSchema = JSON.parse(template.form_schema);
    } catch (error) {
        throw new Error('Invalid form schema');
    }
    
    // Get all submissions for this template
    const submissionsQuery = `
        SELECT submission_data FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.id = ? AND ft.created_by = ? ${dateFilter}
    `;
    
    const submissions = await env.DB.prepare(submissionsQuery).bind(templateId, userId).all();
    
    // Analyze field completion rates
    const fields = formSchema.fields || [];
    const totalSubmissions = submissions.results?.length || 0;
    
    const fieldAnalytics = fields.map(field => {
        let completedCount = 0;
        let values = [];
        
        submissions.results?.forEach(submission => {
            try {
                const data = JSON.parse(submission.submission_data);
                const fieldValue = data[field.name];
                
                if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                    completedCount++;
                    values.push(fieldValue);
                }
            } catch (error) {
                console.error('Error parsing submission data:', error);
            }
        });
        
        const completionRate = totalSubmissions > 0 ? (completedCount / totalSubmissions) * 100 : 0;
        
        // Generate field-specific insights
        let insights = {};
        if (field.type === 'select' || field.type === 'radio') {
            insights = generateChoiceFieldInsights(values, field);
        } else if (field.type === 'number') {
            insights = generateNumericFieldInsights(values);
        } else if (field.type === 'text' || field.type === 'textarea') {
            insights = generateTextFieldInsights(values);
        }
        
        return {
            field_name: field.name,
            field_type: field.type,
            field_label: field.label || field.name,
            completion_rate: Math.round(completionRate),
            completed_count: completedCount,
            total_submissions: totalSubmissions,
            insights: insights
        };
    });
    
    return {
        template_id: templateId,
        total_submissions: totalSubmissions,
        field_analytics: fieldAnalytics
    };
}

/**
 * Export data in various formats
 */
async function exportData(env, userId, templateId, startDate, endDate, format) {
    const dateFilter = buildDateFilter(startDate, endDate);
    const templateFilter = templateId ? `AND ft.id = ?` : '';
    
    const query = `
        SELECT 
            fs.id,
            fs.submitted_at,
            ft.name as form_name,
            ft.id as template_id,
            fs.submission_data
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        ORDER BY fs.submitted_at DESC
    `;
    
    const params = [userId];
    if (templateId) params.push(templateId);
    
    const results = await env.DB.prepare(query).bind(...params).all();
    const submissions = results.results || [];
    
    if (format === 'csv') {
        const csv = generateCSV(submissions);
        return addCorsHeaders(new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="form-submissions-${Date.now()}.csv"`
            }
        }));
    } else {
        // JSON export
        const exportData = {
            exported_at: new Date().toISOString(),
            total_records: submissions.length,
            filters: {
                template_id: templateId,
                start_date: startDate,
                end_date: endDate
            },
            submissions: submissions.map(sub => ({
                ...sub,
                submission_data: JSON.parse(sub.submission_data)
            }))
        };
        
        return addCorsHeaders(new Response(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="form-submissions-${Date.now()}.json"`
            }
        }));
    }
}

/**
 * Helper function to build date filter SQL
 */
function buildDateFilter(startDate, endDate) {
    let filter = '';
    
    if (startDate) {
        filter += ` AND fs.submitted_at >= '${startDate}'`;
    }
    
    if (endDate) {
        filter += ` AND fs.submitted_at <= '${endDate} 23:59:59'`;
    }
    
    return filter;
}

/**
 * Generate insights for choice fields (select, radio)
 */
function generateChoiceFieldInsights(values, field) {
    const choices = field.options || [];
    const choiceCounts = {};
    
    choices.forEach(choice => {
        choiceCounts[choice.value || choice] = 0;
    });
    
    values.forEach(value => {
        if (choiceCounts.hasOwnProperty(value)) {
            choiceCounts[value]++;
        }
    });
    
    const mostPopular = Object.entries(choiceCounts)
        .sort(([,a], [,b]) => b - a)[0];
    
    return {
        choice_distribution: choiceCounts,
        most_popular: mostPopular ? {
            value: mostPopular[0],
            count: mostPopular[1]
        } : null,
        total_responses: values.length
    };
}

/**
 * Generate insights for numeric fields
 */
function generateNumericFieldInsights(values) {
    const numbers = values.filter(v => !isNaN(v)).map(Number);
    
    if (numbers.length === 0) {
        return { no_numeric_data: true };
    }
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const sorted = numbers.sort((a, b) => a - b);
    
    return {
        count: numbers.length,
        average: Math.round(avg * 100) / 100,
        minimum: sorted[0],
        maximum: sorted[sorted.length - 1],
        median: sorted.length % 2 === 0 
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]
    };
}

/**
 * Generate insights for text fields
 */
function generateTextFieldInsights(values) {
    const lengths = values.map(v => String(v).length);
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    
    return {
        response_count: values.length,
        average_length: values.length > 0 ? Math.round(totalLength / values.length) : 0,
        min_length: Math.min(...lengths) || 0,
        max_length: Math.max(...lengths) || 0
    };
}

/**
 * Generate CSV from submissions data
 */
function generateCSV(submissions) {
    if (submissions.length === 0) {
        return 'No data available';
    }
    
    // Parse all submission data to determine all possible columns
    const allFields = new Set(['id', 'form_name', 'template_id', 'submitted_at']);
    
    submissions.forEach(sub => {
        try {
            const data = JSON.parse(sub.submission_data);
            Object.keys(data).forEach(key => allFields.add(key));
        } catch (error) {
            console.error('Error parsing submission data for CSV:', error);
        }
    });
    
    const headers = Array.from(allFields);
    const csvRows = [headers.join(',')];
    
    submissions.forEach(sub => {
        try {
            const data = JSON.parse(sub.submission_data);
            const row = headers.map(header => {
                let value = '';
                
                if (header === 'id') value = sub.id;
                else if (header === 'form_name') value = sub.form_name;
                else if (header === 'template_id') value = sub.template_id;
                else if (header === 'submitted_at') value = sub.submitted_at;
                else value = data[header] || '';
                
                // Escape quotes and wrap in quotes if contains comma
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""');
                    if (value.includes(',')) {
                        value = `"${value}"`;
                    }
                }
                
                return value;
            });
            
            csvRows.push(row.join(','));
        } catch (error) {
            console.error('Error processing submission for CSV:', error);
        }
    });
    
    return csvRows.join('\n');
}