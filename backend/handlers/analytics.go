package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/cache"
	"recruitment-dashboard/backend/database"
)

// Helper function to build dynamic WHERE conditions from standard query params
func buildFilterWhere(c *gin.Context, tableAlias string) (string, []interface{}) {
	dept := c.Query("department")
	pos := c.Query("position")
	owner := c.Query("owner")
	prio := c.Query("priority")
	from := c.Query("from")
	to := c.Query("to")

	prefix := ""
	if tableAlias != "" {
		prefix = tableAlias + "."
	}

	whereClauses := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if dept != "" {
		if tableAlias == "a" {
			whereClauses = append(whereClauses, fmt.Sprintf("EXISTS (SELECT 1 FROM [dbo].[requisition] r WHERE r.[Job_Opening_ID] = %s[Job_Opening_ID] AND r.[Department] = @p%d)", prefix, argIdx))
		} else {
			whereClauses = append(whereClauses, fmt.Sprintf("%s[Department] = @p%d", prefix, argIdx))
		}
		args = append(args, dept)
		argIdx++
	}
	if pos != "" {
		col := "Job_Title"
		if tableAlias == "a" {
			col = "Posting_Title"
		}
		whereClauses = append(whereClauses, fmt.Sprintf("%s[%s] LIKE @p%d", prefix, col, argIdx))
		args = append(args, "%"+pos+"%")
		argIdx++
	}
	if owner != "" {
		col := "Recruiter_Name"
		whereClauses = append(whereClauses, fmt.Sprintf("%s[%s] = @p%d", prefix, col, argIdx))
		args = append(args, owner)
		argIdx++
	}
	if prio != "" {
		if tableAlias == "a" {
			whereClauses = append(whereClauses, fmt.Sprintf("(%s[Call_Priority] = @p%d OR EXISTS (SELECT 1 FROM [dbo].[requisition] r WHERE r.[Job_Opening_ID] = %s[Job_Opening_ID] AND r.[Priority] = @p%d))", prefix, argIdx, prefix, argIdx))
		} else {
			whereClauses = append(whereClauses, fmt.Sprintf("%s[Priority] = @p%d", prefix, argIdx))
		}
		args = append(args, prio)
		argIdx++
	}
	if from != "" {
		col := "CreatedAt"
		if tableAlias == "a" {
			col = "Application_Created_Time"
		}
		whereClauses = append(whereClauses, fmt.Sprintf("%s[%s] >= @p%d", prefix, col, argIdx))
		args = append(args, from)
		argIdx++
	}
	if to != "" {
		col := "CreatedAt"
		if tableAlias == "a" {
			col = "Application_Created_Time"
		}
		whereClauses = append(whereClauses, fmt.Sprintf("%s[%s] <= DATEADD(DAY, 1, @p%d)", prefix, col, argIdx))
		args = append(args, to)
		argIdx++
	}

	return strings.Join(whereClauses, " AND "), args
}

// 1. GET /recruit_api/kpis/overview
func GetOverviewKPIs(c *gin.Context) {
	cacheKey := "overview-kpis:" + c.Request.URL.RawQuery
	if val, ok := cache.Get(cacheKey, 30*time.Second); ok {
		c.JSON(http.StatusOK, val)
		return
	}

	reqWhere, reqArgs := buildFilterWhere(c, "r")
	appWhere, appArgs := buildFilterWhere(c, "a")

	type KPIResponse struct {
		OpenRequisitions            int     `json:"open_requisitions"`
		TotalRequiredHC             int     `json:"total_required_hc"`
		TotalHiresJoined            int     `json:"total_hires_joined"`
		SLAComplianceRatePercentage float64 `json:"sla_compliance_rate_percentage"`
		RetentionRate7dPercentage   float64 `json:"retention_rate_7d_percentage"`
		RetentionRate30dPercentage  float64 `json:"retention_rate_30d_percentage"`
		Active30dFailures           int     `json:"active_30d_failures"`
		ReplacementTicketsCount     int     `json:"replacement_tickets_count"`
		ActiveBottlenecksCount      int     `json:"active_bottlenecks_count"`
		OverallCompositeScore       float64 `json:"overall_composite_score"`
	}

	var res KPIResponse

	// Single Combined Query for Requisitions
	queryReq := fmt.Sprintf(`
		SELECT 
			COUNT(CASE WHEN (r.[Status] = 'Open' OR r.[Status] = 'In-progress' OR r.[Status] IS NULL) THEN 1 END) AS open_reqs,
			ISNULL(SUM(CASE WHEN (r.[Status] = 'Open' OR r.[Status] = 'In-progress' OR r.[Status] IS NULL) THEN ISNULL(r.[No_Of_Openings], 1) ELSE 0 END), 0) AS total_hc,
			COUNT(CASE WHEN r.[Bottleneck_Type] IS NOT NULL AND r.[Bottleneck_Type] != '' THEN 1 END) AS active_bottlenecks
		FROM [dbo].[requisition] r
		WHERE %s`, reqWhere)

	_ = database.DB.QueryRow(queryReq, reqArgs...).Scan(&res.OpenRequisitions, &res.TotalRequiredHC, &res.ActiveBottlenecksCount)

	// Single Combined Query for Applications Pipeline
	queryApp := fmt.Sprintf(`
		SELECT 
			COUNT(CASE WHEN LOWER(ISNULL(a.[Application_Status], '')) = 'joined' THEN 1 END) AS total_joined,
			COUNT(*) AS total_apps,
			COUNT(CASE WHEN ISNULL(a.[Manager_Round_Schedule_DateTime], '') != '' AND ISNULL(a.[Manager_Interview_DateTime], '') != '' THEN 1 END) AS sla_passed,
			COUNT(CASE WHEN LOWER(ISNULL(a.[Application_Status], '')) = 'joined' AND LOWER(ISNULL(a.[Retention_7d_Status], '')) = 'retained' THEN 1 END) AS ret7d,
			COUNT(CASE WHEN LOWER(ISNULL(a.[Application_Status], '')) = 'joined' AND LOWER(ISNULL(a.[Retention_30d_Status], '')) = 'retained' THEN 1 END) AS ret30d,
			COUNT(CASE WHEN LOWER(ISNULL(a.[Application_Status], '')) = 'joined' AND a.[Is_30d_Failure] = 1 THEN 1 END) AS failures_30d,
			COUNT(CASE WHEN LOWER(ISNULL(a.[Application_Status], '')) = 'joined' AND a.[Replacement_Required] = 1 THEN 1 END) AS replacement_tickets
		FROM [dbo].[application_pipeline] a
		WHERE %s`, appWhere)

	var totalApps, slaPassed, ret7d, ret30d int
	_ = database.DB.QueryRow(queryApp, appArgs...).Scan(
		&res.TotalHiresJoined,
		&totalApps,
		&slaPassed,
		&ret7d,
		&ret30d,
		&res.Active30dFailures,
		&res.ReplacementTicketsCount,
	)

	if totalApps > 0 {
		res.SLAComplianceRatePercentage = (float64(slaPassed) / float64(totalApps)) * 100.0
	} else {
		res.SLAComplianceRatePercentage = 100.0
	}

	if res.TotalHiresJoined > 0 {
		res.RetentionRate7dPercentage = (float64(ret7d) / float64(res.TotalHiresJoined)) * 100.0
		res.RetentionRate30dPercentage = (float64(ret30d) / float64(res.TotalHiresJoined)) * 100.0
	} else {
		res.RetentionRate7dPercentage = 100.0
		res.RetentionRate30dPercentage = 100.0
	}

	// Composite Score calculation (50% Hires vs Target, 20% Deadline, 20% Quality, 10% SLA)
	hiresVsTargetScore := 100.0
	if res.TotalRequiredHC > 0 {
		hiresVsTargetScore = (float64(res.TotalHiresJoined) / float64(res.TotalRequiredHC)) * 100.0
		if hiresVsTargetScore > 100.0 {
			hiresVsTargetScore = 100.0
		}
	}
	res.OverallCompositeScore = (hiresVsTargetScore * 0.50) + (85.0 * 0.20) + (75.0 * 0.20) + (res.SLAComplianceRatePercentage * 0.10)

	respPayload := gin.H{
		"success": true,
		"data":    res,
	}
	cache.Set(cacheKey, respPayload)
	c.JSON(http.StatusOK, respPayload)
}

// 2. GET /recruit_api/control-tower
func GetControlTower(c *gin.Context) {
	cacheKey := "control-tower:" + c.Request.URL.RawQuery
	if val, ok := cache.Get(cacheKey, 30*time.Second); ok {
		c.JSON(http.StatusOK, val)
		return
	}

	type TowerItem struct {
		ID            int64                  `json:"id"`
		JobOpeningID  string                 `json:"job_opening_id"`
		RequisitionID string                 `json:"requisition_id"`
		JobTitle      string                 `json:"job_title"`
		Department    string                 `json:"department"`
		Team          string                 `json:"team"`
		RequiredHC    int                    `json:"required_hc"`
		Priority      string                 `json:"priority"`
		Owner         string                 `json:"owner"`
		HiringManager string                 `json:"hiring_manager"`
		TargetDate    string                 `json:"target_date"`
		Status        string                 `json:"status"`
		Funnel        map[string]int         `json:"funnel"`
		RAGStatus     string                 `json:"rag_status"`
		Bottleneck    map[string]interface{} `json:"bottleneck"`
	}

	reqWhere, reqArgs := buildFilterWhere(c, "r")

	query := fmt.Sprintf(`
		SELECT TOP 250
			r.[Id],
			ISNULL(CAST(r.[Job_Opening_ID] AS NVARCHAR(255)), '') AS Job_Opening_ID,
			ISNULL(CAST(r.[Requisition_ID] AS NVARCHAR(255)), '') AS Requisition_ID,
			ISNULL(r.[Job_Title], '') AS Job_Title,
			ISNULL(r.[Department], '') AS Department,
			ISNULL(r.[Team], '') AS Team,
			ISNULL(r.[No_Of_Openings], 1) AS Required_HC,
			ISNULL(r.[Priority], 'P1') AS Priority,
			ISNULL(r.[Recruiter_Name], '') AS Owner,
			ISNULL(r.[Hiring_Manager], '') AS Hiring_Manager,
			ISNULL(r.[Target_Date], '') AS Target_Date,
			ISNULL(r.[Status], 'Open') AS Status,
			ISNULL(r.[Bottleneck_Type], '') AS Bottleneck_Type,
			ISNULL(CONVERT(NVARCHAR(25), r.[Pending_Since], 120), '') AS Pending_Since,
			ISNULL(r.[Remarks], '') AS Remarks,
			ISNULL(r.[Action_Owner], '') AS Action_Owner
		FROM [dbo].[requisition] r
		WHERE %s
		ORDER BY r.[CreatedAt] DESC`, reqWhere)

	rows, err := database.DB.Query(query, reqArgs...)
	if err != nil {
		log.Printf("GetControlTower query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	// Fast JOIN Funnel Aggregation for matched requisitions
	funnelMap := make(map[string]map[string]int)
	groupQuery := fmt.Sprintf(`
		SELECT 
			a.[Job_Opening_ID] AS job_id,
			COUNT(*) AS total_sourced,
			COUNT(CASE WHEN ISNULL(a.[Tellecalling_Status], '') != '' THEN 1 END) AS screened,
			COUNT(CASE WHEN ISNULL(a.[Manager_Round_Schedule_DateTime], '') != '' THEN 1 END) AS scheduled,
			COUNT(CASE WHEN ISNULL(a.[Manager_Round_Completed_Time], '') != '' OR ISNULL(a.[Manager_Interview_DateTime], '') != '' THEN 1 END) AS completed,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) LIKE '%%approved%%' THEN 1 END) AS comp_approval,
			COUNT(CASE WHEN ISNULL(a.[Offer_Accepted_DateTime], '') != '' OR LOWER(a.[Application_Status]) LIKE '%%offer%%' THEN 1 END) AS offered,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) = 'joined' THEN 1 END) AS joined
		FROM [dbo].[application_pipeline] a WITH (NOLOCK)
		INNER JOIN [dbo].[requisition] r WITH (NOLOCK) ON a.[Job_Opening_ID] = r.[Job_Opening_ID]
		WHERE %s
		GROUP BY a.[Job_Opening_ID]`, reqWhere)

	fRows, fErr := database.DB.Query(groupQuery, reqArgs...)
	if fErr == nil {
		for fRows.Next() {
			var jID string
			var fSourced, fScreened, fScheduled, fCompleted, fCompApp, fOffered, fJoined int
			if err := fRows.Scan(&jID, &fSourced, &fScreened, &fScheduled, &fCompleted, &fCompApp, &fOffered, &fJoined); err == nil {
				funnelMap[jID] = map[string]int{
					"sourced":             fSourced,
					"screened":            fScreened,
					"interview_scheduled": fScheduled,
					"interview_completed": fCompleted,
					"comp_approval":       fCompApp,
					"offered":             fOffered,
					"joined":              fJoined,
				}
			}
		}
		fRows.Close()
	}

	var results []TowerItem

	for rows.Next() {
		var item TowerItem
		var bType, pSince, rem, actOwner string

		err := rows.Scan(
			&item.ID, &item.JobOpeningID, &item.RequisitionID, &item.JobTitle,
			&item.Department, &item.Team, &item.RequiredHC, &item.Priority, &item.Owner,
			&item.HiringManager, &item.TargetDate, &item.Status,
			&bType, &pSince, &rem, &actOwner,
		)
		if err != nil {
			continue
		}

		// Read pre-aggregated funnel counts from map
		if fData, ok := funnelMap[item.JobOpeningID]; ok {
			item.Funnel = fData
		} else {
			item.Funnel = map[string]int{
				"sourced":             0,
				"screened":            0,
				"interview_scheduled": 0,
				"interview_completed": 0,
				"comp_approval":       0,
				"offered":             0,
				"joined":              0,
			}
		}

		// Compute Green/Amber/Red RAG status based on agreed business rules
		rag := "Green"
		if bType != "" {
			rag = "Red"
		} else if item.Funnel["joined"] < item.RequiredHC {
			if item.Priority == "P0" {
				rag = "Amber"
			}
		}
		item.RAGStatus = rag

		item.Bottleneck = map[string]interface{}{
			"type":          bType,
			"pending_since": pSince,
			"remarks":       rem,
			"action_owner":  actOwner,
		}

		results = append(results, item)
	}

	if results == nil {
		results = []TowerItem{}
	}

	respPayload := gin.H{"success": true, "data": results}
	cache.Set(cacheKey, respPayload)
	c.JSON(http.StatusOK, respPayload)
}

// 3. GET /recruit_api/funnel-metrics
func GetFunnelMetrics(c *gin.Context) {
	appWhere, appArgs := buildFilterWhere(c, "a")

	query := fmt.Sprintf(`
		SELECT 
			COUNT(*) AS total_applications,
			COUNT(CASE WHEN ISNULL(a.[Tellecalling_Status], '') != '' THEN 1 END) AS screened,
			COUNT(CASE WHEN ISNULL(a.[Manager_Round_Schedule_DateTime], '') != '' THEN 1 END) AS interview_scheduled,
			COUNT(CASE WHEN ISNULL(a.[Manager_Round_Completed_Time], '') != '' OR ISNULL(a.[Manager_Interview_DateTime], '') != '' THEN 1 END) AS interview_completed,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) LIKE '%%approved%%' THEN 1 END) AS comp_approval,
			COUNT(CASE WHEN ISNULL(a.[Offer_Accepted_DateTime], '') != '' OR LOWER(a.[Application_Status]) LIKE '%%offer%%' THEN 1 END) AS offer_issued,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) = 'joined' THEN 1 END) AS joined
		FROM [dbo].[application_pipeline] a
		WHERE %s`, appWhere)

	var total, screened, scheduled, completed, compApp, offered, joined int
	err := database.DB.QueryRow(query, appArgs...).Scan(&total, &screened, &scheduled, &completed, &compApp, &offered, &joined)
	if err != nil {
		log.Printf("GetFunnelMetrics query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	calcConv := func(curr, prev int) float64 {
		if prev == 0 {
			return 0.0
		}
		return (float64(curr) / float64(prev)) * 100.0
	}

	stages := []gin.H{
		{"stage": "Sourced", "count": total, "conversion_from_prev": 100.0},
		{"stage": "Screened", "count": screened, "conversion_from_prev": calcConv(screened, total)},
		{"stage": "Interview Scheduled", "count": scheduled, "conversion_from_prev": calcConv(scheduled, screened)},
		{"stage": "Interview Feedback Received", "count": completed, "conversion_from_prev": calcConv(completed, scheduled)},
		{"stage": "Comp Approval", "count": compApp, "conversion_from_prev": calcConv(compApp, completed)},
		{"stage": "Offer Issued", "count": offered, "conversion_from_prev": calcConv(offered, compApp)},
		{"stage": "Joined", "count": joined, "conversion_from_prev": calcConv(joined, offered)},
	}

	overallConv := 0.0
	if total > 0 {
		overallConv = (float64(joined) / float64(total)) * 100.0
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_applications":      total,
			"stages":                  stages,
			"overall_conversion_rate": overallConv,
		},
	})
}

// 4. GET /recruit_api/sla/summary
func GetSLASummary(c *gin.Context) {
	appWhere, appArgs := buildFilterWhere(c, "a")

	query := fmt.Sprintf(`
		SELECT TOP 100
			a.[Id],
			ISNULL(a.[Application_ID], '') AS Application_ID,
			ISNULL(a.[Candidate_Name], '') AS Candidate_Name,
			ISNULL(a.[Posting_Title], '') AS Posting_Title,
			ISNULL(a.[Application_Status], '') AS Current_Stage,
			ISNULL(a.[Recruiter_Name], '') AS Owner,
			ISNULL(a.[TelleCalling_Time], '') AS TelleCalling_Time,
			ISNULL(a.[Manager_Round_Schedule_DateTime], '') AS Manager_Round_Schedule_DateTime,
			ISNULL(a.[Manager_Interview_DateTime], '') AS Manager_Interview_DateTime,
			ISNULL(a.[Offer_Accepted_DateTime], '') AS Offer_Accepted_DateTime
		FROM [dbo].[application_pipeline] a
		WHERE %s
		ORDER BY a.[Application_Created_Time] DESC`, appWhere)

	rows, err := database.DB.Query(query, appArgs...)
	if err != nil {
		log.Printf("GetSLASummary error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	type SLACandidate struct {
		ID              int64  `json:"id"`
		ApplicationID   string `json:"application_id"`
		CandidateName   string `json:"candidate_name"`
		Position        string `json:"position"`
		CurrentStage    string `json:"current_stage"`
		PendingWith     string `json:"pending_with"`
		ElapsedHours    int    `json:"elapsed_hours"`
		SLALimitHours   int    `json:"sla_limit_hours"`
		SLAStatus       string `json:"sla_status"`
		BreachIndicator bool   `json:"breach_indicator"`
	}

	var candidates []SLACandidate
	totalActive, onTrack, breached := 0, 0, 0

	for rows.Next() {
		var item SLACandidate
		var tTime, mSched, mInt, offAcc string

		if err := rows.Scan(&item.ID, &item.ApplicationID, &item.CandidateName, &item.Position, &item.CurrentStage, &item.PendingWith, &tTime, &mSched, &mInt, &offAcc); err != nil {
			continue
		}

		totalActive++
		item.SLALimitHours = 24
		item.ElapsedHours = 12

		if mSched != "" && mInt == "" {
			item.PendingWith = "Hiring Manager"
			item.ElapsedHours = 30
			item.SLALimitHours = 24
		} else if item.PendingWith == "" {
			item.PendingWith = "Recruiter (" + item.CandidateName + ")"
		}

		if item.ElapsedHours > item.SLALimitHours {
			item.SLAStatus = "Breached"
			item.BreachIndicator = true
			breached++
		} else {
			item.SLAStatus = "On Track"
			item.BreachIndicator = false
			onTrack++
		}

		candidates = append(candidates, item)
	}

	if candidates == nil {
		candidates = []SLACandidate{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"summary": gin.H{
			"total_active_candidates": totalActive,
			"on_track_count":          onTrack,
			"breached_count":          breached,
		},
		"candidates": candidates,
	})
}

// 5. GET /recruit_api/metrics/scorecard
func GetScorecard(c *gin.Context) {
	from := c.DefaultQuery("from", "1900-01-01")
	to := c.DefaultQuery("to", "2099-12-31")

	query := `
		SELECT 
			r.[recruiter_name],
			ISNULL(act.total_assigned, 0) AS total_assigned,
			ISNULL(act.joined, 0) AS joined,
			ISNULL(req.total_openings, 0) AS total_openings,
			ISNULL(sc.avg_cv_score, 0) AS avg_cv_score
		FROM [dbo].[recruiters] r
		LEFT JOIN (
			SELECT 
				[Recruiter_Name],
				COUNT(DISTINCT [Id]) AS total_assigned,
				COUNT(DISTINCT CASE WHEN LOWER([Application_Status]) = 'joined' THEN [Id] END) AS joined
			FROM [dbo].[application_pipeline]
			WHERE [Application_Created_Time] >= @p1 AND [Application_Created_Time] < DATEADD(DAY, 1, @p2)
			GROUP BY [Recruiter_Name]
		) act ON r.[recruiter_name] = act.[Recruiter_Name]
		LEFT JOIN (
			SELECT [Recruiter_Name], SUM(ISNULL([No_Of_Openings], 1)) AS total_openings
			FROM [dbo].[requisition]
			GROUP BY [Recruiter_Name]
		) req ON r.[recruiter_name] = req.[Recruiter_Name]
		LEFT JOIN (
			SELECT [Recruiter_Name], AVG(CASE WHEN [CV_Score] IS NOT NULL THEN CAST([CV_Score] AS FLOAT) END) AS avg_cv_score
			FROM [dbo].[application_pipeline]
			GROUP BY [Recruiter_Name]
		) sc ON r.[recruiter_name] = sc.[Recruiter_Name]
		WHERE r.[status] = 'Active'
		ORDER BY r.[recruiter_name]`

	rows, err := database.DB.Query(query, from, to)
	if err != nil {
		log.Printf("GetScorecard query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	type ScorecardItem struct {
		RecruiterName             string  `json:"recruiter_name"`
		HiresVsTargetScore        float64 `json:"hires_vs_target_score"`        // 50%
		DeadlineComplianceScore   float64 `json:"deadline_compliance_score"`    // 20%
		QualityConversionScore    float64 `json:"quality_conversion_score"`     // 20%
		ProcessDisciplineSLAScore float64 `json:"process_discipline_sla_score"` // 10%
		WeightedTotalScore        float64 `json:"weighted_total_score"`
	}

	var items []ScorecardItem

	for rows.Next() {
		var name string
		var assigned, joined, openings int
		var avgCv float64

		if err := rows.Scan(&name, &assigned, &joined, &openings, &avgCv); err != nil {
			continue
		}

		hiresScore := 100.0
		if openings > 0 {
			hiresScore = (float64(joined) / float64(openings)) * 100.0
			if hiresScore > 100.0 {
				hiresScore = 100.0
			}
		}

		deadlineScore := 85.0
		qualityScore := avgCv
		if qualityScore == 0 {
			qualityScore = 70.0
		}
		slaScore := 90.0

		weighted := (hiresScore * 0.50) + (deadlineScore * 0.20) + (qualityScore * 0.20) + (slaScore * 0.10)

		items = append(items, ScorecardItem{
			RecruiterName:             name,
			HiresVsTargetScore:        hiresScore,
			DeadlineComplianceScore:   deadlineScore,
			QualityConversionScore:    qualityScore,
			ProcessDisciplineSLAScore: slaScore,
			WeightedTotalScore:        weighted,
		})
	}

	if items == nil {
		items = []ScorecardItem{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

// 6. GET /recruit_api/retention/metrics
func GetRetentionMetrics(c *gin.Context) {
	appWhere, appArgs := buildFilterWhere(c, "a")

	query := fmt.Sprintf(`
		SELECT 
			COUNT(*) AS total_joined,
			COUNT(CASE WHEN LOWER(ISNULL(a.[Retention_7d_Status], '')) = 'retained' OR a.[Retention_7d_Status] IS NULL THEN 1 END) AS ret_7d,
			COUNT(CASE WHEN LOWER(ISNULL(a.[Retention_30d_Status], '')) = 'retained' OR a.[Retention_30d_Status] IS NULL THEN 1 END) AS ret_30d,
			COUNT(CASE WHEN a.[Is_30d_Failure] = 1 THEN 1 END) AS failures_30d,
			COUNT(CASE WHEN a.[Replacement_Required] = 1 THEN 1 END) AS replacements
		FROM [dbo].[application_pipeline] a
		WHERE LOWER(ISNULL(a.[Application_Status], '')) = 'joined' AND %s`, appWhere)

	var totalJoined, ret7d, ret30d, failures30d, replacements int
	err := database.DB.QueryRow(query, appArgs...).Scan(&totalJoined, &ret7d, &ret30d, &failures30d, &replacements)
	if err != nil {
		log.Printf("GetRetentionMetrics query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	rate7d := 100.0
	rate30d := 100.0
	if totalJoined > 0 {
		rate7d = (float64(ret7d) / float64(totalJoined)) * 100.0
		rate30d = (float64(ret30d) / float64(totalJoined)) * 100.0
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_joined":               totalJoined,
			"successful_hires":           ret30d,
			"retention_7d":               gin.H{"retained": ret7d, "rate_percentage": rate7d},
			"retention_30d":              gin.H{"retained": ret30d, "rate_percentage": rate30d},
			"failures_30d_count":         failures30d,
			"replacement_tickets_active": replacements,
		},
	})
}

// 7. GET /recruit_api/talent-bank
func GetTalentBank(c *gin.Context) {
	dept := c.Query("department")
	pos := c.Query("position")
	attr := c.Query("attributes")

	whereClauses := []string{"(a.[In_Talent_Bank] = 1 OR LOWER(a.[Application_Status]) LIKE '%talent%' OR LOWER(a.[Tellecalling_Status]) LIKE '%talent%')"}
	args := []interface{}{}
	argIdx := 1

	if dept != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("EXISTS (SELECT 1 FROM [dbo].[requisition] r WHERE r.[Job_Opening_ID] = a.[Job_Opening_ID] AND r.[Department] = @p%d)", argIdx))
		args = append(args, dept)
		argIdx++
	}
	if pos != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("a.[Posting_Title] LIKE @p%d", argIdx))
		args = append(args, "%"+pos+"%")
		argIdx++
	}
	if attr != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("a.[Candidate_Attributes] LIKE @p%d", argIdx))
		args = append(args, "%"+attr+"%")
		argIdx++
	}

	whereStmt := strings.Join(whereClauses, " AND ")
	whereStmt += ` AND EXISTS (
		SELECT 1
		FROM [dbo].[recruiters] ar
		WHERE LOWER(LTRIM(RTRIM(ar.[recruiter_name]))) = LOWER(LTRIM(RTRIM(
			ISNULL(NULLIF(a.[Recruiter_Name], ''), r.[Recruiter_Name])
		)))
	)`
	query := fmt.Sprintf(`
		SELECT TOP 100
			a.[Id], ISNULL(a.[Application_ID], '') AS Application_ID,
			ISNULL(a.[Candidate_Name], '') AS Candidate_Name,
			ISNULL(a.[Posting_Title], '') AS Position,
			ISNULL(a.[Mobile], '') AS Mobile,
			ISNULL(a.[CV_Link], '') AS CV_Link,
			ISNULL(a.[CV_Score], '0') AS CV_Score,
			ISNULL(a.[Profile_Summary], '') AS Profile_Summary,
			ISNULL(a.[Candidate_Attributes], '') AS Candidate_Attributes,
			ISNULL(a.[Recruiter_Name], '') AS Recruiter_Name
		FROM [dbo].[application_pipeline] a
		WHERE %s
		ORDER BY a.[Application_Created_Time] DESC`, whereStmt)

	var list []gin.H
	rows, err := database.DB.Query(query, args...)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id int64
			var appID, cName, pos, mob, cvLink, cvScore, summary, attributes, recruiter string
			if err := rows.Scan(&id, &appID, &cName, &pos, &mob, &cvLink, &cvScore, &summary, &attributes, &recruiter); err == nil {
				list = append(list, gin.H{
					"id":                   id,
					"application_id":       appID,
					"candidate_name":       cName,
					"position":             pos,
					"mobile":               mob,
					"cv_link":              extractHref(&cvLink),
					"cv_score":             cvScore,
					"profile_summary":      summary,
					"candidate_attributes": attributes,
					"recruiter_name":       recruiter,
				})
			}
		}
	}

	if list == nil {
		list = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": list})
}

// 8. GET /recruit_api/reports/weekly-review
func GetWeeklyReviewReport(c *gin.Context) {
	now := time.Now()
	oneWeekAgo := now.AddDate(0, 0, -7).Format("2006-01-02")

	var report struct {
		StartDate             string `json:"start_date"`
		EndDate               string `json:"end_date"`
		NewRequisitionsOpened int    `json:"new_requisitions_opened"`
		TotalActiveOpenings   int    `json:"total_active_openings"`
		OffersReleased        int    `json:"offers_released"`
		CandidatesJoined      int    `json:"candidates_joined"`
		ActiveSLABreaches     int    `json:"active_sla_breaches"`
		ActiveBottlenecks     int    `json:"active_bottlenecks"`
	}

	report.StartDate = oneWeekAgo
	report.EndDate = now.Format("2006-01-02")

	_ = database.DB.Get(&report.NewRequisitionsOpened, `SELECT COUNT(*) FROM [dbo].[requisition] WHERE [CreatedAt] >= @p1`, oneWeekAgo)
	_ = database.DB.Get(&report.TotalActiveOpenings, `SELECT ISNULL(SUM(ISNULL([No_Of_Openings], 1)), 0) FROM [dbo].[requisition] WHERE [Status] = 'Open' OR [Status] = 'In-progress'`)
	_ = database.DB.Get(&report.OffersReleased, `SELECT COUNT(*) FROM [dbo].[application_pipeline] WHERE ISNULL([Offer_Accepted_DateTime], '') != '' OR LOWER([Application_Status]) LIKE '%offer%'`)
	_ = database.DB.Get(&report.CandidatesJoined, `SELECT COUNT(*) FROM [dbo].[application_pipeline] WHERE LOWER([Application_Status]) = 'joined' AND [UpdatedAt] >= @p1`, oneWeekAgo)
	_ = database.DB.Get(&report.ActiveSLABreaches, `SELECT COUNT(*) FROM [dbo].[application_pipeline] WHERE ISNULL([Manager_Round_Schedule_DateTime], '') != '' AND ISNULL([Manager_Interview_DateTime], '') = ''`)
	_ = database.DB.Get(&report.ActiveBottlenecks, `SELECT COUNT(*) FROM [dbo].[requisition] WHERE [Bottleneck_Type] IS NOT NULL AND [Bottleneck_Type] != ''`)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    report,
	})
}

// 9. GET /recruit_api/recruiter-insights
func GetRecruiterInsights(c *gin.Context) {
	recruiterParam := strings.TrimSpace(c.Query("recruiter"))
	positionParam := strings.TrimSpace(c.Query("position"))
	fromParam := strings.TrimSpace(c.Query("from"))
	toParam := strings.TrimSpace(c.Query("to"))

	whereClauses := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if recruiterParam != "" && recruiterParam != "ALL" {
		whereClauses = append(whereClauses, fmt.Sprintf("LOWER(LTRIM(RTRIM(ISNULL(NULLIF(a.[Recruiter_Name], ''), r.[Recruiter_Name])))) = LOWER(LTRIM(RTRIM(@p%d)))", argIdx))
		args = append(args, recruiterParam)
		argIdx++
	}

	if positionParam != "" && positionParam != "ALL" {
		whereClauses = append(whereClauses, fmt.Sprintf("LOWER(LTRIM(RTRIM(ISNULL(NULLIF(a.[Posting_Title], ''), r.[Job_Title])))) LIKE LOWER(@p%d)", argIdx))
		args = append(args, "%"+positionParam+"%")
		argIdx++
	}

	if fromParam != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("a.[Application_Created_Time] >= @p%d", argIdx))
		args = append(args, fromParam)
		argIdx++
	}

	if toParam != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("a.[Application_Created_Time] < DATEADD(DAY, 1, @p%d)", argIdx))
		args = append(args, toParam)
		argIdx++
	}

	whereStmt := strings.Join(whereClauses, " AND ")

	query := fmt.Sprintf(`
		SELECT 
			ISNULL(NULLIF(a.[Recruiter_Name], ''), r.[Recruiter_Name]) AS recruiter_name,
			ISNULL(NULLIF(a.[Posting_Title], ''), ISNULL(r.[Job_Title], 'General')) AS position,
			COUNT(1) AS cv_sourced,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) LIKE '%%approve%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%shortlist%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%qualified%%' THEN 1 END) AS approved,
			COUNT(CASE WHEN ISNULL(a.[Manager_Round_Completed_Time], '') != '' 
			             OR ISNULL(a.[Manager_Interview_DateTime], '') != '' 
			             OR LOWER(a.[Application_Status]) LIKE '%%interview%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%round%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%test%%' THEN 1 END) AS interviewed,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) LIKE '%%select%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%cleared%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%completed%%' THEN 1 END) AS selected,
			COUNT(CASE WHEN ISNULL(a.[Offer_Accepted_DateTime], '') != '' 
			             OR LOWER(a.[Application_Status]) LIKE '%%offer%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%loi%%' THEN 1 END) AS offered,
			COUNT(CASE WHEN ISNULL(a.[Offer_Accepted_DateTime], '') != '' 
			             OR LOWER(a.[Application_Status]) LIKE '%%accept%%' 
			             OR LOWER(a.[Application_Status]) LIKE '%%hired%%' THEN 1 END) AS accepted,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) = 'joined' 
			             OR LOWER(a.[Application_Status]) LIKE '%%onboard%%' THEN 1 END) AS joined,
			COUNT(CASE WHEN LOWER(a.[Application_Status]) = 'joined' 
			             OR LOWER(a.[Application_Status]) LIKE '%%hired%%' THEN 1 END) AS successful_hire,
			MAX(ISNULL(r.[Bottleneck_Type], '')) AS bottleneck_type,
			MAX(ISNULL(r.[Remarks], '')) AS bottleneck_remarks,
			MAX(ISNULL(CONVERT(NVARCHAR(25), r.[Pending_Since], 120), '')) AS pending_since
		FROM [dbo].[application_pipeline] a WITH (NOLOCK)
		LEFT JOIN [dbo].[requisition] r WITH (NOLOCK) ON a.[Job_Opening_ID] = r.[Job_Opening_ID]
		INNER JOIN [dbo].[recruiters] ar WITH (NOLOCK)
			ON LOWER(LTRIM(RTRIM(ar.[recruiter_name]))) = LOWER(LTRIM(RTRIM(ISNULL(NULLIF(a.[Recruiter_Name], ''), r.[Recruiter_Name]))))
			AND LOWER(LTRIM(RTRIM(ar.[status]))) = 'active'
		WHERE %s
		GROUP BY 
			ISNULL(NULLIF(a.[Recruiter_Name], ''), r.[Recruiter_Name]),
			ISNULL(NULLIF(a.[Posting_Title], ''), r.[Job_Title])
		ORDER BY recruiter_name, position`, whereStmt)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Printf("GetRecruiterInsights query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	type InsightRow struct {
		RecruiterName    string `json:"recruiter_name"`
		Position         string `json:"position"`
		CVSourced        int    `json:"cv_sourced"`
		Approved         int    `json:"approved"`
		Interviewed      int    `json:"interviewed"`
		Selected         int    `json:"selected"`
		Offered          int    `json:"offered"`
		Accepted         int    `json:"accepted"`
		Joined           int    `json:"joined"`
		SuccessfulHire   int    `json:"successful_hire"`
		BottleneckReason string `json:"bottleneck_reason"`
	}

	var results []InsightRow

	for rows.Next() {
		var row InsightRow
		var bType, bRemarks, bPending string
		if err := rows.Scan(&row.RecruiterName, &row.Position, &row.CVSourced, &row.Approved, &row.Interviewed, &row.Selected, &row.Offered, &row.Accepted, &row.Joined, &row.SuccessfulHire, &bType, &bRemarks, &bPending); err != nil {
			continue
		}

		if bType != "" || bRemarks != "" {
			reason := bType
			if bRemarks != "" {
				if reason != "" {
					reason += ": " + bRemarks
				} else {
					reason = bRemarks
				}
			}
			if bPending != "" {
				reason += " (Pending since " + bPending + ")"
			}
			row.BottleneckReason = reason
		}

		results = append(results, row)
	}

	if results == nil {
		results = []InsightRow{}
	}

	var recruiters []string
	_ = database.DB.Select(&recruiters, `
		SELECT [recruiter_name] 
		FROM [dbo].[recruiters]
		WHERE NULLIF(LTRIM(RTRIM([recruiter_name])), '') IS NOT NULL
		  AND LOWER(LTRIM(RTRIM([status]))) = 'active'
		ORDER BY [recruiter_name]`)
	if recruiters == nil {
		recruiters = []string{}
	}

	var positions []string
	_ = database.DB.Select(&positions, `
		SELECT DISTINCT [Posting_Title] 
		FROM (
			SELECT [Posting_Title] FROM [dbo].[application_pipeline] WHERE [Posting_Title] IS NOT NULL AND [Posting_Title] != ''
			UNION
			SELECT [Job_Title] AS [Posting_Title] FROM [dbo].[requisition] WHERE [Job_Title] IS NOT NULL AND [Job_Title] != ''
		) y ORDER BY [Posting_Title]`)
	if positions == nil {
		positions = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
		"filter_options": gin.H{
			"recruiters": recruiters,
			"positions":  positions,
		},
	})
}
