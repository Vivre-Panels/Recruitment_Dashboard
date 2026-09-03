package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/database"
	"recruitment-dashboard/backend/models"
)

func toString(v interface{}) *string {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case string:
		return &val
	case float64:
		s := strconv.FormatFloat(val, 'f', 0, 64)
		return &s
	default:
		s := fmt.Sprintf("%v", val)
		return &s
	}
}

func CreateRequisition(c *gin.Context) {
	var req models.Requisition

	log.Printf("Received request from %s", c.ClientIP())

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Bad request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("Processing requisition: %+v", req.RequisitionID)

	openings := parseNoOfOpenings(req.NoOfOpenings)
	requisitionID := toString(req.RequisitionID)
	jobOpeningID := toString(req.JobOpeningID)

	query := `MERGE [dbo].[requisition] AS target
		USING (SELECT @p1 AS Requisition_ID) AS source
		ON target.[Requisition_ID] = source.[Requisition_ID]
		WHEN MATCHED THEN
			UPDATE SET
				[Job_Opening_ID] = @p2,
				[Department] = @p3,
				[Team] = ISNULL(@p23, target.[Team]),
				[Job_Description] = @p4,
				[Job_Title] = @p5,
				[No_Of_Openings] = @p6,
				[Opening_Date] = @p7,
				[Recruiter_Name] = @p8,
				[Status] = @p9,
				[Target_Date] = @p10,
				[Hiring_Manager] = ISNULL(@p11, target.[Hiring_Manager]),
				[Priority] = ISNULL(@p12, target.[Priority]),
				[Salary_Range] = ISNULL(@p13, target.[Salary_Range]),
				[Location] = ISNULL(@p14, target.[Location]),
				[Experience_Required] = ISNULL(@p15, target.[Experience_Required]),
				[Preferred_Industries] = ISNULL(@p16, target.[Preferred_Industries]),
				[Must_Haves] = ISNULL(@p17, target.[Must_Haves]),
				[Knockout_Criteria] = ISNULL(@p18, target.[Knockout_Criteria]),
				[Bottleneck_Type] = ISNULL(@p19, target.[Bottleneck_Type]),
				[Pending_Since] = ISNULL(@p20, target.[Pending_Since]),
				[Remarks] = ISNULL(@p21, target.[Remarks]),
				[Action_Owner] = ISNULL(@p22, target.[Action_Owner]),
				[UpdatedAt] = GETUTCDATE()
		WHEN NOT MATCHED THEN
			INSERT ([Requisition_ID], [Job_Opening_ID], [Department], [Team], [Job_Description],
				[Job_Title], [No_Of_Openings], [Opening_Date], [Recruiter_Name],
				[Status], [Target_Date], [Hiring_Manager], [Priority], [Salary_Range],
				[Location], [Experience_Required], [Preferred_Industries], [Must_Haves],
				[Knockout_Criteria], [Bottleneck_Type], [Pending_Since], [Remarks], [Action_Owner])
			VALUES (@p1, @p2, @p3, @p23, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15, @p16, @p17, @p18, @p19, @p20, @p21, @p22)
		OUTPUT INSERTED.[Id];`

	var newID int64
	err := database.DB.DB.QueryRow(query,
		requisitionID,
		jobOpeningID,
		req.Department,
		req.JobDescription,
		req.JobTitle,
		openings,
		req.OpeningDate,
		req.RecruiterName,
		req.Status,
		req.TargetDate,
		req.HiringManager,
		req.Priority,
		req.SalaryRange,
		req.Location,
		req.ExperienceRequired,
		req.PreferredIndustries,
		req.MustHaves,
		req.KnockoutCriteria,
		req.BottleneckType,
		req.PendingSince,
		req.Remarks,
		req.ActionOwner,
		req.Team,
	).Scan(&newID)

	if err != nil {
		log.Printf("Failed to save requisition: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to save requisition",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Requisition saved successfully",
		"data": gin.H{
			"id":              newID,
			"Requisition_ID":  requisitionID,
			"Job_Opening_ID":  jobOpeningID,
		},
	})

	fmt.Printf("Requisition saved with ID: %d (Requisition_ID: %v)\n", newID, req.RequisitionID)
}

func GetRequisitions(c *gin.Context) {
	dept := c.Query("department")
	pos := c.Query("position")
	owner := c.Query("owner")
	prio := c.Query("priority")
	from := c.Query("from")
	to := c.Query("to")

	whereClauses := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if dept != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Department] = @p%d", argIdx))
		args = append(args, dept)
		argIdx++
	}
	if pos != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Job_Title] LIKE @p%d", argIdx))
		args = append(args, "%"+pos+"%")
		argIdx++
	}
	if owner != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Recruiter_Name] = @p%d", argIdx))
		args = append(args, owner)
		argIdx++
	}
	if prio != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[Priority] = @p%d", argIdx))
		args = append(args, prio)
		argIdx++
	}
	if from != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[CreatedAt] >= @p%d", argIdx))
		args = append(args, from)
		argIdx++
	}
	if to != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("[CreatedAt] <= DATEADD(DAY, 1, @p%d)", argIdx))
		args = append(args, to)
		argIdx++
	}

	whereStmt := strings.Join(whereClauses, " AND ")
	query := fmt.Sprintf(`SELECT [Id], [Job_Opening_ID], [Requisition_ID], [Department], ISNULL([Team], '') AS Team, [Job_Description],
		[Job_Title], [No_Of_Openings], [Opening_Date], [Recruiter_Name],
		[Status], [Target_Date], [Hiring_Manager], [Priority], [Salary_Range], [Location],
		[Experience_Required], [Preferred_Industries], [Must_Haves], [Knockout_Criteria],
		[Bottleneck_Type], [Pending_Since], [Remarks], [Action_Owner], [CreatedAt], [UpdatedAt]
		FROM [dbo].[requisition] WHERE %s ORDER BY [CreatedAt] DESC`, whereStmt)

	var requisitions []models.Requisition
	err := database.DB.Select(&requisitions, query, args...)
	if err != nil {
		log.Printf("Failed to fetch requisitions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch requisitions",
			"error":   err.Error(),
		})
		return
	}

	if requisitions == nil {
		requisitions = []models.Requisition{}
	}

	for i := range requisitions {
		requisitions[i].JobOpeningID = toString(requisitions[i].JobOpeningID)
		requisitions[i].RequisitionID = toString(requisitions[i].RequisitionID)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    requisitions,
	})
}

func parseNoOfOpenings(v interface{}) *int {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case float64:
		n := int(val)
		return &n
	case string:
		if val == "" {
			return nil
		}
		n, err := strconv.Atoi(val)
		if err != nil {
			return nil
		}
		return &n
	default:
		return nil
	}
}
