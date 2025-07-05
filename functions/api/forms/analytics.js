import { createResponse, handleCORS } from '../../auth/utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    const url = new URL(request.url);
    
    switch (request.method) {
      case 'GET':
        return await handleGetAnalytics(env, url.searchParams);
      case 'POST':
        return await handleTrackEvent(request, env);
      default:
        return createResponse(false, 'Method not allowed', null, 405);
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
}

/**
 * Handle GET requests - retrieve analytics data
 */
async function handleGetAnalytics(env, searchParams) {
  const type = searchParams.get('type') || 'overview';
  const templateId = searchParams.get('template_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y
  
  try {
    switch (type) {
      case 'overview':
        return await getOverviewAnalytics(env, timeframe, startDate, endDate);
      case 'template':
        if (!templateId) {
          return createResponse(false, 'Template ID is required for template analytics', null, 400);
        }
        return await getTemplateAnalytics(env, templateId, timeframe, startDate, endDate);
      case 'submissions':
        return await getSubmissionAnalytics(env, templateId, timeframe, startDate, endDate);
      case 'users':
        return await getUserAnalytics(env, timeframe, startDate, endDate);
      case 'performance':
        return await getPerformanceAnalytics(env, templateId, timeframe, startDate, endDate);
      default:
        return createResponse(false, 'Invalid analytics type', null, 400);
    }
  } catch (error) {
    console.error('Get analytics error:', error);
    return createResponse(false, 'Failed to retrieve analytics', null, 500);
  }
}

/**
 * Handle POST requests - track analytics events
 */
async function handleTrackEvent(request, env) {
  try {
    const data = await request.json();
    const { event_type, template_id, metadata } = data;
    
    if (!event_type) {
      return createResponse(false, 'Event type is required', null, 400);
    }
    
    const now = new Date().toISOString();
    
    // Insert analytics event - use "Anonymous" as user_id for open access
    const result = await env.DB.prepare(`
      INSERT INTO analytics_events (event_type, template_id, user_id, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      event_type,
      template_id || null,
      'anonymous', // Anonymous user for open access
      now,
      metadata ? JSON.stringify(metadata) : null
    ).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to track event', null, 500);
    }
    
    return createResponse(true, 'Event tracked successfully', { event_id: result.meta.last_row_id });
  } catch (error) {
    console.error('Track event error:', error);
    return createResponse(false, 'Failed to track event', null, 500);
  }
}

/**
 * Get overview analytics - system-wide data without user restrictions
 */
async function getOverviewAnalytics(env, timeframe, startDate, endDate) {
  const dateRange = getDateRange(timeframe, startDate, endDate);
  
  // Total statistics - system-wide
  const totalStats = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM form_templates) as total_templates,
      (SELECT COUNT(*) FROM form_submissions WHERE submitted_at >= ? AND submitted_at <= ?) as total_submissions,
      (SELECT COUNT(DISTINCT submitted_by) FROM form_submissions WHERE submitted_at >= ? AND submitted_at <= ?) as active_users,
      (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users
  `).bind(dateRange.start, dateRange.end, dateRange.start, dateRange.end).first();
  
  // Submission trends (daily) - all submissions
  const submissionTrends = await env.DB.prepare(`
    SELECT 
      DATE(submitted_at) as date,
      COUNT(*) as count
    FROM form_submissions 
    WHERE submitted_at >= ? AND submitted_at <= ?
    GROUP BY DATE(submitted_at)
    ORDER BY date
  `).bind(dateRange.start, dateRange.end).all();
  
  // Top templates by submissions - all templates
  const topTemplates = await env.DB.prepare(`
    SELECT
      ft.id,
      ft.name,
      COUNT(fs.id) as submission_count,
      AVG(fs.score) as average_score
    FROM form_templates ft
    LEFT JOIN form_submissions fs ON ft.id = fs.template_id
      AND fs.submitted_at >= ? AND fs.submitted_at <= ?
    GROUP BY ft.id, ft.name
    ORDER BY submission_count DESC
    LIMIT 10
  `).bind(dateRange.start, dateRange.end).all();
  
  // User activity distribution - all users
  const userActivity = await env.DB.prepare(`
    SELECT 
      u.role,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(fs.id) as submission_count
    FROM users u
    LEFT JOIN form_submissions fs ON u.id = fs.submitted_by 
      AND fs.submitted_at >= ? AND fs.submitted_at <= ?
    GROUP BY u.role
  `).bind(dateRange.start, dateRange.end).all();
  
  return createResponse(true, 'Overview analytics retrieved', {
    stats: totalStats,
    trends: {
      submissions: submissionTrends.results || []
    },
    top_templates: topTemplates.results || [],
    user_activity: userActivity.results || [],
    date_range: dateRange
  });
}

/**
 * Get template-specific analytics - open access
 */
async function getTemplateAnalytics(env, templateId, timeframe, startDate, endDate) {
  const dateRange = getDateRange(timeframe, startDate, endDate);
  
  // Template info and stats
  const templateInfo = await env.DB.prepare(`
    SELECT 
      ft.*,
      'Anonymous' as creator_name,
      COUNT(fs.id) as total_submissions,
      AVG(fs.score) as average_score,
      MIN(fs.score) as min_score,
      MAX(fs.score) as max_score
    FROM form_templates ft
    LEFT JOIN form_submissions fs ON ft.id = fs.template_id
      AND fs.submitted_at >= ? AND fs.submitted_at <= ?
    WHERE ft.id = ?
    GROUP BY ft.id
  `).bind(dateRange.start, dateRange.end, templateId).first();
  
  if (!templateInfo) {
    return createResponse(false, 'Template not found', null, 404);
  }
  
  // Submission timeline - all submissions for this template
  const submissionTimeline = await env.DB.prepare(`
    SELECT 
      DATE(submitted_at) as date,
      COUNT(*) as submissions,
      AVG(score) as average_score
    FROM form_submissions 
    WHERE template_id = ? AND submitted_at >= ? AND submitted_at <= ?
    GROUP BY DATE(submitted_at)
    ORDER BY date
  `).bind(templateId, dateRange.start, dateRange.end).all();
  
  // Score distribution - all scores for this template
  const scoreDistribution = await env.DB.prepare(`
    SELECT 
      CASE 
        WHEN score >= 90 THEN '90-100'
        WHEN score >= 80 THEN '80-89'
        WHEN score >= 70 THEN '70-79'
        WHEN score >= 60 THEN '60-69'
        WHEN score >= 50 THEN '50-59'
        ELSE '0-49'
      END as score_range,
      COUNT(*) as count
    FROM form_submissions 
    WHERE template_id = ? AND submitted_at >= ? AND submitted_at <= ? AND score IS NOT NULL
    GROUP BY score_range
    ORDER BY score_range DESC
  `).bind(templateId, dateRange.start, dateRange.end).all();
  
  // Completion stats - all submissions for this template
  const completionStats = await env.DB.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM form_submissions 
    WHERE template_id = ? AND submitted_at >= ? AND submitted_at <= ?
    GROUP BY status
  `).bind(templateId, dateRange.start, dateRange.end).all();
  
  // Recent submissions - all recent submissions for this template
  const recentSubmissions = await env.DB.prepare(`
    SELECT 
      fs.id,
      fs.score,
      fs.status,
      fs.submitted_at,
      'Anonymous' as submitter_name,
      'anonymous@example.com' as submitter_email
    FROM form_submissions fs
    WHERE fs.template_id = ? AND fs.submitted_at >= ? AND fs.submitted_at <= ?
    ORDER BY fs.submitted_at DESC
    LIMIT 20
  `).bind(templateId, dateRange.start, dateRange.end).all();
  
  return createResponse(true, 'Template analytics retrieved', {
    template: templateInfo,
    timeline: submissionTimeline.results || [],
    score_distribution: scoreDistribution.results || [],
    completion_stats: completionStats.results || [],
    recent_submissions: recentSubmissions.results || [],
    date_range: dateRange
  });
}

/**
 * Get submission analytics - system-wide data
 */
async function getSubmissionAnalytics(env, templateId, timeframe, startDate, endDate) {
  const dateRange = getDateRange(timeframe, startDate, endDate);
  
  let whereClause = 'WHERE fs.submitted_at >= ? AND fs.submitted_at <= ?';
  let params = [dateRange.start, dateRange.end];
  
  if (templateId) {
    whereClause += ' AND fs.template_id = ?';
    params.push(templateId);
  }
  
  // Submission volume trends - all submissions
  const volumeTrends = await env.DB.prepare(`
    SELECT 
      DATE(fs.submitted_at) as date,
      COUNT(*) as total_submissions,
      COUNT(CASE WHEN fs.status = 'completed' THEN 1 END) as completed_submissions,
      AVG(fs.score) as average_score
    FROM form_submissions fs
    ${whereClause}
    GROUP BY DATE(fs.submitted_at)
    ORDER BY date
  `).bind(...params).all();
  
  // Time-to-completion analysis - all submissions
  const timeAnalysis = await env.DB.prepare(`
    SELECT 
      AVG(JULIANDAY(fs.submitted_at) - JULIANDAY(ae.timestamp)) * 24 * 60 as avg_completion_time_minutes,
      COUNT(*) as sample_size
    FROM form_submissions fs
    JOIN analytics_events ae ON fs.template_id = ae.template_id 
      AND ae.event_type = 'form_started'
      AND ae.timestamp <= fs.submitted_at
    ${whereClause.replace('fs.submitted_at', 'fs.submitted_at')}
  `).bind(...params).first();
  
  // Popular submission times - all submissions
  const timeDistribution = await env.DB.prepare(`
    SELECT 
      CASE 
        WHEN CAST(strftime('%H', submitted_at) AS INTEGER) BETWEEN 6 AND 11 THEN 'Morning (6-11)'
        WHEN CAST(strftime('%H', submitted_at) AS INTEGER) BETWEEN 12 AND 17 THEN 'Afternoon (12-17)'
        WHEN CAST(strftime('%H', submitted_at) AS INTEGER) BETWEEN 18 AND 21 THEN 'Evening (18-21)'
        ELSE 'Night (22-5)'
      END as time_period,
      COUNT(*) as count
    FROM form_submissions fs
    ${whereClause}
    GROUP BY time_period
  `).bind(...params).all();
  
  // User engagement metrics - system-wide
  const engagementMetrics = await env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT fs.submitted_by) as unique_users,
      COUNT(*) as total_submissions,
      COUNT(*) * 1.0 / COUNT(DISTINCT fs.submitted_by) as avg_submissions_per_user,
      COUNT(CASE WHEN user_submission_count.submission_count > 1 THEN 1 END) as returning_users
    FROM form_submissions fs
    JOIN (
      SELECT 
        submitted_by, 
        COUNT(*) as submission_count
      FROM form_submissions 
      ${whereClause.replace('fs.', '')}
      GROUP BY submitted_by
    ) user_submission_count ON fs.submitted_by = user_submission_count.submitted_by
    ${whereClause}
  `).bind(...params, ...params).first();
  
  return createResponse(true, 'Submission analytics retrieved', {
    volume_trends: volumeTrends.results || [],
    time_analysis: timeAnalysis,
    time_distribution: timeDistribution.results || [],
    engagement_metrics: engagementMetrics,
    date_range: dateRange
  });
}

/**
 * Get user analytics - system-wide data
 */
async function getUserAnalytics(env, timeframe, startDate, endDate) {
  const dateRange = getDateRange(timeframe, startDate, endDate);
  
  // User registration trends - all users
  const registrationTrends = await env.DB.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_users
    FROM users 
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `).bind(dateRange.start, dateRange.end).all();
  
  // User role distribution - all users
  const roleDistribution = await env.DB.prepare(`
    SELECT 
      role,
      COUNT(*) as count
    FROM users
    GROUP BY role
  `).bind().all();
  
  // Most active users - all users
  const activeUsers = await env.DB.prepare(`
    SELECT 
      'Anonymous' as name,
      'anonymous@example.com' as email,
      'user' as role,
      COUNT(fs.id) as submission_count,
      AVG(fs.score) as average_score,
      MAX(fs.submitted_at) as last_submission
    FROM form_submissions fs
    WHERE fs.submitted_at >= ? AND fs.submitted_at <= ?
    GROUP BY fs.submitted_by
    HAVING submission_count > 0
    ORDER BY submission_count DESC, average_score DESC
    LIMIT 20
  `).bind(dateRange.start, dateRange.end).all();
  
  // User activity patterns - all users
  const activityPatterns = await env.DB.prepare(`
    SELECT 
      strftime('%w', fs.submitted_at) as day_of_week,
      strftime('%H', fs.submitted_at) as hour_of_day,
      COUNT(*) as activity_count
    FROM form_submissions fs
    WHERE fs.submitted_at >= ? AND fs.submitted_at <= ?
    GROUP BY day_of_week, hour_of_day
    ORDER BY activity_count DESC
  `).bind(dateRange.start, dateRange.end).all();
  
  return createResponse(true, 'User analytics retrieved', {
    registration_trends: registrationTrends.results || [],
    role_distribution: roleDistribution.results || [],
    active_users: activeUsers.results || [],
    activity_patterns: activityPatterns.results || [],
    date_range: dateRange
  });
}

/**
 * Get performance analytics - system-wide data
 */
async function getPerformanceAnalytics(env, templateId, timeframe, startDate, endDate) {
  const dateRange = getDateRange(timeframe, startDate, endDate);
  
  let whereClause = 'WHERE ae.timestamp >= ? AND ae.timestamp <= ?';
  let params = [dateRange.start, dateRange.end];
  
  if (templateId) {
    whereClause += ' AND ae.template_id = ?';
    params.push(templateId);
  }
  
  // Event distribution - all events
  const eventDistribution = await env.DB.prepare(`
    SELECT 
      event_type,
      COUNT(*) as count
    FROM analytics_events ae
    ${whereClause}
    GROUP BY event_type
    ORDER BY count DESC
  `).bind(...params).all();
  
  // Template performance comparison - all templates
  const templatePerformance = await env.DB.prepare(`
    SELECT
      ft.id,
      ft.name,
      COUNT(CASE WHEN ae.event_type = 'form_started' THEN 1 END) as starts,
      COUNT(CASE WHEN ae.event_type = 'form_submission' THEN 1 END) as completions,
      CASE
        WHEN COUNT(CASE WHEN ae.event_type = 'form_started' THEN 1 END) > 0
        THEN (COUNT(CASE WHEN ae.event_type = 'form_submission' THEN 1 END) * 100.0 /
              COUNT(CASE WHEN ae.event_type = 'form_started' THEN 1 END))
        ELSE 0
      END as completion_rate,
      AVG(fs.score) as average_score
    FROM form_templates ft
    LEFT JOIN analytics_events ae ON ft.id = ae.template_id
      AND ae.timestamp >= ? AND ae.timestamp <= ?
    LEFT JOIN form_submissions fs ON ft.id = fs.template_id
      AND fs.submitted_at >= ? AND fs.submitted_at <= ?
    GROUP BY ft.id, ft.name
    ORDER BY completion_rate DESC, starts DESC
  `).bind(dateRange.start, dateRange.end, dateRange.start, dateRange.end).all();
  
  // Error tracking - all errors
  const errorEvents = await env.DB.prepare(`
    SELECT 
      DATE(ae.timestamp) as date,
      COUNT(*) as error_count,
      ae.metadata
    FROM analytics_events ae
    WHERE ae.event_type = 'form_error' 
      AND ae.timestamp >= ? AND ae.timestamp <= ?
    GROUP BY DATE(ae.timestamp), ae.metadata
    ORDER BY date DESC
  `).bind(dateRange.start, dateRange.end).all();
  
  return createResponse(true, 'Performance analytics retrieved', {
    event_distribution: eventDistribution.results || [],
    template_performance: templatePerformance.results || [],
    error_events: errorEvents.results || [],
    date_range: dateRange
  });
}

/**
 * Calculate date range based on timeframe
 */
function getDateRange(timeframe, startDate, endDate) {
  const now = new Date();
  let start, end;
  
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = now;
    
    switch (timeframe) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}