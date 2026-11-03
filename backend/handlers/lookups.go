package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/database"
)

type RecruitmentLookups struct {
	Departments    []string        `json:"departments"`
	Teams          []string        `json:"teams"`
	HiringManagers []string        `json:"hiring_managers"`
	Priorities     []string        `json:"priorities"`
	Statuses       []string        `json:"statuses"`
	Recruiters     []RecruiterInfo `json:"recruiters"`
}

func GetRecruitmentLookups(c *gin.Context) {
	var options RecruitmentLookups
	queries := []struct {
		name   string
		query  string
		target *[]string
	}{
		{"departments", `SELECT DISTINCT LTRIM(RTRIM([Department])) FROM [dbo].[requisition] WHERE NULLIF(LTRIM(RTRIM([Department])), '') IS NOT NULL ORDER BY LTRIM(RTRIM([Department]))`, &options.Departments},
		{"teams", `SELECT DISTINCT LTRIM(RTRIM([Team])) FROM [dbo].[requisition] WHERE NULLIF(LTRIM(RTRIM([Team])), '') IS NOT NULL ORDER BY LTRIM(RTRIM([Team]))`, &options.Teams},
		{"hiring managers", `SELECT DISTINCT LTRIM(RTRIM([Hiring_Manager])) FROM [dbo].[requisition] WHERE NULLIF(LTRIM(RTRIM([Hiring_Manager])), '') IS NOT NULL ORDER BY LTRIM(RTRIM([Hiring_Manager]))`, &options.HiringManagers},
		{"priorities", `SELECT DISTINCT LTRIM(RTRIM([Priority])) FROM [dbo].[requisition] WHERE NULLIF(LTRIM(RTRIM([Priority])), '') IS NOT NULL ORDER BY LTRIM(RTRIM([Priority]))`, &options.Priorities},
		{"statuses", `SELECT DISTINCT LTRIM(RTRIM([Status])) FROM [dbo].[requisition] WHERE NULLIF(LTRIM(RTRIM([Status])), '') IS NOT NULL ORDER BY LTRIM(RTRIM([Status]))`, &options.Statuses},
	}

	for _, item := range queries {
		if err := database.DB.Select(item.target, item.query); err != nil {
			log.Printf("Failed to fetch recruitment %s: %v", item.name, err)
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to load recruitment options"})
			return
		}
	}

	if err := database.DB.Select(&options.Recruiters,
		`SELECT [recruiter_id], [recruiter_name], [email], [User_ID], [status]
		 FROM [dbo].[recruiters]
		 WHERE LOWER(LTRIM(RTRIM([status]))) = 'active'
		 ORDER BY [recruiter_name]`); err != nil {
		log.Printf("Failed to fetch recruitment recruiters: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to load recruitment options"})
		return
	}

	if options.Departments == nil {
		options.Departments = []string{}
	}
	if options.Teams == nil {
		options.Teams = []string{}
	}
	if options.HiringManagers == nil {
		options.HiringManagers = []string{}
	}
	if options.Priorities == nil {
		options.Priorities = []string{}
	}
	if options.Statuses == nil {
		options.Statuses = []string{}
	}
	if options.Recruiters == nil {
		options.Recruiters = []RecruiterInfo{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": options})
}
