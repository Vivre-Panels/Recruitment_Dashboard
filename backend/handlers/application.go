package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/cache"
	"recruitment-dashboard/backend/database"
	"recruitment-dashboard/backend/models"
)

func CreateApplication(c *gin.Context) {
	var app models.Application

	log.Printf("Received request from %s", c.ClientIP())

	if err := c.ShouldBindJSON(&app); err != nil {
		log.Printf("Bad request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"error":   err.Error(),
		})
		return
	}

	if app.ApplicationID != nil {
		log.Printf("Processing application ID: %s", *app.ApplicationID)
	} else {
		log.Printf("Processing application with nil ID")
	}

	query := `MERGE [dbo].[application_pipeline] AS target
		USING (SELECT @p1 AS Application_ID) AS source
		ON target.[Application_ID] = source.[Application_ID]
		WHEN MATCHED THEN
			UPDATE SET
				[Application_Created_Time] = @p2,
				[Application_Status] = @p3,
				[Call_Audit_Score] = @p4,
				[Call_Priority] = @p5,
				[Candidate_Name] = @p6,
				[CV_Link] = @p7,
				[CV_Score] = @p8,
				[Job_Opening_ID] = @p9,
				[Mobile] = @p10,
				[Posting_Title] = @p11,
				[Recruiter_Name] = @p12,
				[Source] = @p13,
				[Profile_Summary] = @p14,
				[Tellecalling_Feedback] = @p15,
				[TelleCalling_Time] = @p16,
				[Tellecalling_Status] = @p17,
				[Offer_Accepted_DateTime] = @p18,
				[Manager_Interview_DateTime] = @p19,
				[Manager_Round_Schedule_DateTime] = @p20,
				[Manager_Round_Completed_Time] = @p21,
				[UpdatedAt] = GETUTCDATE()
		WHEN NOT MATCHED THEN
			INSERT ([Application_ID], [Application_Created_Time], [Application_Status],
				[Call_Audit_Score], [Call_Priority], [Candidate_Name], [CV_Link],
				[CV_Score], [Job_Opening_ID], [Mobile], [Posting_Title], [Recruiter_Name],
				[Source], [Profile_Summary], [Tellecalling_Feedback],
				[TelleCalling_Time], [Tellecalling_Status], [Offer_Accepted_DateTime],
				[Manager_Interview_DateTime], [Manager_Round_Schedule_DateTime], [Manager_Round_Completed_Time])
			VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15,
				@p16, @p17, @p18, @p19, @p20, @p21)
		OUTPUT INSERTED.[Id];`

	auditScore := parseFloat(app.CallAuditScore)
	cvScore := parseFloat(app.CVScore)
	cvLink := extractHref(app.CVLink)
	jobOpeningID := toString(app.JobOpeningID)

	var newID int64
	err := database.DB.DB.QueryRow(query,
		app.ApplicationID,
		app.ApplicationCreatedTime,
		app.ApplicationStatus,
		auditScore,
		app.CallPriority,
		app.CandidateName,
		cvLink,
		cvScore,
		jobOpeningID,
		app.Mobile,
		app.PostingTitle,
		app.RecruiterName,
		app.Source,
		app.ProfileSummary,
		app.TellecallingFeedback,
		app.TelleCallingTime,
		app.TellecallingStatus,
		app.OfferAcceptedDateTime,
		app.ManagerInterviewDateTime,
		app.ManagerRoundScheduleDateTime,
		app.ManagerRoundCompletedTime,
	).Scan(&newID)

	if err != nil {
		log.Printf("Failed to save application: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to save application",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Application saved successfully",
		"data": gin.H{
			"id":             newID,
			"Application_ID": app.ApplicationID,
		},
	})

	if app.ApplicationID != nil {
		fmt.Printf("Application saved with ID: %d (Application_ID: %s)\n", newID, *app.ApplicationID)
	} else {
		fmt.Printf("Application saved with ID: %d\n", newID)
	}
}

func GetApplications(c *gin.Context) {
	cacheKey := "applications:" + c.Request.URL.RawQuery
	if val, ok := cache.Get(cacheKey, 30*time.Second); ok {
		c.JSON(http.StatusOK, val)
		return
	}

	dept := c.Query("department")
	pos := c.Query("position")
	owner := c.Query("owner")
	prio := c.Query("priority")
	from := c.Query("from")
	to := c.Query("to")

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "2000")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 2000
	}
	if limit > 10000 {
		limit = 10000
	}
	offset := (page - 1) * limit

	whereClauses := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if dept != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("EXISTS (SELECT 1 FROM [dbo].[requisition] r WHERE r.[Job_Opening_ID] = [dbo].[application_pipeline].[Job_Opening_ID] AND r.[Department] = @p%d)", argIdx))
		args = append(args, dept)
		argIdx++
	}
	if pos != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Posting_Title] LIKE @p%d", argIdx))
		args = append(args, "%"+pos+"%")
		argIdx++
	}
	if owner != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Recruiter_Name] = @p%d", argIdx))
		args = append(args, owner)
		argIdx++
	}
	if prio != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("([Call_Priority] = @p%d OR EXISTS (SELECT 1 FROM [dbo].[requisition] r WHERE r.[Job_Opening_ID] = [dbo].[application_pipeline].[Job_Opening_ID] AND r.[Priority] = @p%d))", argIdx, argIdx))
		args = append(args, prio)
		argIdx++
	}
	if from != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Application_Created_Time] >= @p%d", argIdx))
		args = append(args, from)
		argIdx++
	}
	if to != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Application_Created_Time] <= DATEADD(DAY, 1, @p%d)", argIdx))
		args = append(args, to)
		argIdx++
	}

	whereStmt := strings.Join(whereClauses, " AND ")

	// Fast Count Total Query (0ms metadata lookup when no filter)
	var total int
	if whereStmt == "1=1" {
		_ = database.DB.Get(&total, `SELECT ISNULL(SUM(p.rows), 0) FROM sys.partitions p WHERE p.object_id = OBJECT_ID('dbo.application_pipeline') AND p.index_id < 2`)
	} else {
		countQuery := fmt.Sprintf(`SELECT COUNT(1) FROM [dbo].[application_pipeline] WHERE %s`, whereStmt)
		_ = database.DB.Get(&total, countQuery, args...)
	}

	// Paginated Data Query with Requisition LEFT JOIN (ID & Title matching) + Intelligent Department & Team Derivation
	query := fmt.Sprintf(`SELECT a.[Id], a.[Application_ID], a.[Application_Created_Time], a.[Application_Status],
		a.[Call_Audit_Score], a.[Call_Priority], a.[Candidate_Name], a.[CV_Link],
		a.[CV_Score], a.[Job_Opening_ID], a.[Mobile], a.[Posting_Title],
		ISNULL(r.[Department], 
			CASE 
				WHEN LOWER(a.[Posting_Title]) LIKE '%%sales%%' OR LOWER(a.[Posting_Title]) LIKE '%%asm%%' THEN 'Sales & BD'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%dispatch%%' OR LOWER(a.[Posting_Title]) LIKE '%%warehouse%%' THEN 'Operations Inbound'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%billing%%' OR LOWER(a.[Posting_Title]) LIKE '%%finance%%' THEN 'Finance & Legal'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%hr%%' OR LOWER(a.[Posting_Title]) LIKE '%%recruiter%%' THEN 'Human Resources'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%developer%%' OR LOWER(a.[Posting_Title]) LIKE '%%tech%%' OR LOWER(a.[Posting_Title]) LIKE '%%engineer%%' THEN 'Software & Tech'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%mdo%%' OR LOWER(a.[Posting_Title]) LIKE '%%executive%%' THEN 'MDO'
				ELSE 'Operations'
			END
		) AS Department,
		ISNULL(r.[Team], 
			CASE 
				WHEN LOWER(a.[Posting_Title]) LIKE '%%sales%%' OR LOWER(a.[Posting_Title]) LIKE '%%asm%%' THEN 'Field Sales'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%dispatch%%' OR LOWER(a.[Posting_Title]) LIKE '%%warehouse%%' THEN 'Warehouse Operations'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%billing%%' THEN 'Billing & Invoicing'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%hr%%' THEN 'Talent Acquisition'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%developer%%' OR LOWER(a.[Posting_Title]) LIKE '%%tech%%' THEN 'Core Product Engineering'
				WHEN LOWER(a.[Posting_Title]) LIKE '%%mdo%%' THEN 'Executive Assistance'
				ELSE 'Operations Support'
			END
		) AS Team,
		a.[Recruiter_Name], a.[Source], a.[Profile_Summary], a.[Tellecalling_Feedback],
		a.[TelleCalling_Time], a.[Tellecalling_Status], a.[Offer_Accepted_DateTime],
		a.[Manager_Interview_DateTime], a.[Manager_Round_Schedule_DateTime], a.[Manager_Round_Completed_Time],
		a.[Call_Duration], a.[Performance_Score], a.[Behaviour_Score], a.[Performance_Eval_Details],
		a.[Behaviour_Eval_Details], a.[Retention_7d_Status], a.[Retention_30d_Status],
		a.[Is_30d_Failure], a.[Replacement_Required], a.[In_Talent_Bank], a.[Candidate_Attributes],
		a.[CreatedAt], a.[UpdatedAt]
		FROM [dbo].[application_pipeline] a WITH (NOLOCK)
		LEFT JOIN [dbo].[requisition] r WITH (NOLOCK) 
			ON (a.[Job_Opening_ID] = r.[Job_Opening_ID] OR LOWER(a.[Posting_Title]) = LOWER(r.[Job_Title]))
		WHERE %s ORDER BY a.[Application_Created_Time] DESC
		OFFSET @p%d ROWS FETCH NEXT @p%d ROWS ONLY`, whereStmt, argIdx, argIdx+1)

	args = append(args, offset, limit)

	var applications []models.Application
	err = database.DB.Select(&applications, query, args...)
	if err != nil {
		log.Printf("Failed to fetch applications: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch applications",
			"error":   err.Error(),
		})
		return
	}

	if applications == nil {
		applications = []models.Application{}
	}

	for i := range applications {
		applications[i].CVLink = extractHref(applications[i].CVLink)
		applications[i].JobOpeningID = toString(applications[i].JobOpeningID)
	}

	respPayload := gin.H{
		"success":     true,
		"data":        applications,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + limit - 1) / limit,
	}
	cache.Set(cacheKey, respPayload)
	c.JSON(http.StatusOK, respPayload)
}

func GetSummary(c *gin.Context) {
	cacheKey := "summary:" + c.Request.URL.RawQuery
	if val, ok := cache.Get(cacheKey, 30*time.Second); ok {
		c.JSON(http.StatusOK, val)
		return
	}

	type Summary struct {
		TotalRequisitions    int `json:"total_requisitions"`
		OpenRequisitions     int `json:"open_requisitions"`
		TotalApplications    int `json:"total_applications"`
		TotalCandidates      int `json:"total_candidates"`
		AvgCVScore           float64 `json:"avg_cv_score"`
		AvgCallAuditScore    float64 `json:"avg_call_audit_score"`
	}

	var summary Summary

	// Single Combined Query for Requisitions
	_ = database.DB.QueryRow(`
		SELECT 
			COUNT(*),
			COUNT(CASE WHEN [Status] = 'Open' OR [Status] IS NULL THEN 1 END)
		FROM [dbo].[requisition]`).Scan(&summary.TotalRequisitions, &summary.OpenRequisitions)

	// Single Combined Query for Applications Pipeline
	_ = database.DB.QueryRow(`
		SELECT 
			COUNT(*),
			COUNT(DISTINCT [Candidate_Name]),
			ISNULL(AVG(CAST([CV_Score] AS FLOAT)), 0),
			ISNULL(AVG(CAST([Call_Audit_Score] AS FLOAT)), 0)
		FROM [dbo].[application_pipeline]`).Scan(&summary.TotalApplications, &summary.TotalCandidates, &summary.AvgCVScore, &summary.AvgCallAuditScore)

	summary.AvgCVScore = MathRound(summary.AvgCVScore)
	summary.AvgCallAuditScore = MathRound(summary.AvgCallAuditScore)

	respPayload := gin.H{
		"success": true,
		"data":    summary,
	}
	cache.Set(cacheKey, respPayload)
	c.JSON(http.StatusOK, respPayload)
}

func MathRound(val float64) float64 {
	return float64(int(val*10.0+0.5)) / 10.0
}

func extractHref(s *string) *string {
	if s == nil || *s == "" {
		return s
	}
	idx := strings.Index(*s, `href=`)
	if idx == -1 {
		return s
	}
	after := (*s)[idx+5:]
	quoteIdx := strings.IndexAny(after, `"'`)
	if quoteIdx == -1 {
		return s
	}
	quote := after[quoteIdx]
	start := idx + 5 + quoteIdx + 1
	end := strings.Index((*s)[start:], string(quote))
	if end == -1 {
		return s
	}
	url := (*s)[start : start+end]
	return &url
}

func parseFloat(s *string) *float64 {
	if s == nil || *s == "" {
		return nil
	}
	v, err := strconv.ParseFloat(*s, 64)
	if err != nil {
		return nil
	}
	return &v
}
