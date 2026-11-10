package database

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/microsoft/go-mssqldb"
	_ "github.com/microsoft/go-mssqldb/sharedmemory"

	"recruitment-dashboard/backend/config"
)

var DB *sqlx.DB

func Connect(cfg *config.Config) {
	var err error
	connStr := DBConnectionString(cfg)
	DB, err = sqlx.Connect("sqlserver", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB.SetMaxOpenConns(20)
	DB.SetMaxIdleConns(10)
	DB.SetConnMaxLifetime(3600)
	DB.SetConnMaxIdleTime(600)

	if err = DB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	// Authentication tables are required by the auth handler and its startup
	// superadmin bootstrap. Create them before the legacy dashboard migrations,
	// so an unrelated legacy migration cannot prevent users from being created.
	if err = ensureAuthTables(); err != nil {
		log.Fatalf("Failed to initialize authentication tables: %v", err)
	}

	RunMigrations()

	fmt.Println("Connected to SQL Server database successfully")
}

func ensureAuthTables() error {
	const recruitersQuery = `
		IF OBJECT_ID(N'[dbo].[recruiters]', N'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[recruiters] (
				[recruiter_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
				[recruiter_name] NVARCHAR(255) NOT NULL,
				[email] NVARCHAR(255) NOT NULL,
				[User_ID] NVARCHAR(255) NOT NULL,
				[status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
				[CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				CONSTRAINT [UQ_recruiters_UserID] UNIQUE ([User_ID])
			)
		END`
	if _, err := DB.Exec(recruitersQuery); err != nil {
		return fmt.Errorf("ensure recruiters table: %w", err)
	}

	const usersQuery = `
		IF OBJECT_ID(N'[dbo].[dashboard_users]', N'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[dashboard_users] (
				[id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_dashboard_users] PRIMARY KEY,
				[recruiter_id] INT NULL,
				[email] NVARCHAR(255) NOT NULL,
				[password_hash] NVARCHAR(255) NOT NULL,
				[role] NVARCHAR(32) NOT NULL,
				[is_active] BIT NOT NULL CONSTRAINT [DF_dashboard_users_is_active] DEFAULT 1,
				[created_at] DATETIME2 NOT NULL CONSTRAINT [DF_dashboard_users_created_at] DEFAULT GETUTCDATE(),
				CONSTRAINT [FK_dashboard_users_recruiters] FOREIGN KEY ([recruiter_id]) REFERENCES [dbo].[recruiters]([recruiter_id]),
				CONSTRAINT [CK_dashboard_users_role] CHECK ([role] IN ('recruiter', 'superadmin')),
				CONSTRAINT [CK_dashboard_users_role_recruiter] CHECK (([role] = 'recruiter' AND [recruiter_id] IS NOT NULL) OR ([role] = 'superadmin' AND [recruiter_id] IS NULL))
			)
		END
		IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[dashboard_users]') AND name = 'UX_dashboard_users_email')
			CREATE UNIQUE INDEX [UX_dashboard_users_email] ON [dbo].[dashboard_users]([email])
		IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[dashboard_users]') AND name = 'UX_dashboard_users_recruiter')
			CREATE UNIQUE INDEX [UX_dashboard_users_recruiter] ON [dbo].[dashboard_users]([recruiter_id]) WHERE [recruiter_id] IS NOT NULL`
	if _, err := DB.Exec(usersQuery); err != nil {
		return fmt.Errorf("ensure dashboard_users table: %w", err)
	}
	return nil
}

func RunMigrations() {
	query := `
		IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[application_pipeline]') AND type in (N'U'))
		BEGIN
			CREATE TABLE [dbo].[application_pipeline] (
				[Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
				[Application_ID] NVARCHAR(255) NULL,
				[Application_Created_Time] DATETIME2 NULL,
				[Application_Status] NVARCHAR(100) NULL,
				[Call_Audit_Score] DECIMAL(5,2) NULL,
				[Call_Priority] NVARCHAR(50) NULL,
				[Candidate_Name] NVARCHAR(255) NULL,
				[CV_Link] NVARCHAR(500) NULL,
				[CV_Score] DECIMAL(5,2) NULL,
				[Job_Opening_ID] NVARCHAR(255) NULL,
				[Mobile] NVARCHAR(50) NULL,
				[Posting_Title] NVARCHAR(500) NULL,
				[Recruiter_Name] NVARCHAR(255) NULL,
				[Source] NVARCHAR(255) NULL,
				[Profile_Summary] NVARCHAR(MAX) NULL,
				[Tellecalling_Feedback] NVARCHAR(MAX) NULL,
				[CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				CONSTRAINT [UQ_application_pipeline_ApplicationID] UNIQUE ([Application_ID])
			)
		END
	`
	_, err := DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	alterQuery := `
		IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[application_pipeline]') AND name = 'Job_Opening_ID')
		BEGIN
			ALTER TABLE [dbo].[application_pipeline] ADD [Job_Opening_ID] NVARCHAR(255) NULL
		END
	`
	_, err = DB.Exec(alterQuery)
	if err != nil {
		log.Fatalf("Failed to alter application_pipeline table: %v", err)
	}

	query = `
		IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[requisition]') AND type in (N'U'))
		BEGIN
			CREATE TABLE [dbo].[requisition] (
				[Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
				[Job_Opening_ID] NVARCHAR(255) NULL,
				[Requisition_ID] NVARCHAR(255) NULL,
				[Department] NVARCHAR(255) NULL,
				[Team] NVARCHAR(255) NULL,
				[Job_Description] NVARCHAR(MAX) NULL,
				[Job_Title] NVARCHAR(500) NULL,
				[No_Of_Openings] INT NULL,
				[Opening_Date] DATETIME2 NULL,
				[Recruiter_Name] NVARCHAR(255) NULL,
				[Status] NVARCHAR(100) NULL,
				[Target_Date] DATETIME2 NULL,
				[CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				CONSTRAINT [UQ_requisition_JobOpeningID] UNIQUE ([Job_Opening_ID]),
				CONSTRAINT [UQ_requisition_RequisitionID] UNIQUE ([Requisition_ID])
			)
		END
	`
	_, err = DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	query = `
		IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[recruiter_calls]') AND type in (N'U'))
		BEGIN
			CREATE TABLE [dbo].[recruiter_calls] (
				[Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
				[Call_ID] NVARCHAR(255) NOT NULL,
				[Call_Start_Time] NVARCHAR(255) NULL,
				[Call_Type] NVARCHAR(100) NULL,
				[Call_Owner_Email] NVARCHAR(255) NULL,
				[Call_Owner] NVARCHAR(255) NULL,
				[Call_Duration] NVARCHAR(50) NULL,
				[Mobile] NVARCHAR(50) NULL,
				[CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				CONSTRAINT [UQ_recruiter_calls_CallID] UNIQUE ([Call_ID])
			)
		END
	`
	_, err = DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to create recruiter_calls table: %v", err)
	}

	newColumns := []string{
		"TelleCalling_Time", "Tellecalling_Status", "Offer_Accepted_DateTime",
		"Manager_Interview_DateTime", "Manager_Round_Schedule_DateTime", "Manager_Round_Completed_Time",
	}
	alterQuery = `
		IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[application_pipeline]') AND name = 'Call_Duration')
		BEGIN
			ALTER TABLE [dbo].[application_pipeline] ADD [Call_Duration] DECIMAL(10,2) NULL DEFAULT 0
		END
	`
	_, err = DB.Exec(alterQuery)
	if err != nil {
		log.Fatalf("Failed to add column Call_Duration: %v", err)
	}

	for _, col := range newColumns {
		alterQuery := fmt.Sprintf(`
			IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[application_pipeline]') AND name = '%s')
			BEGIN
				ALTER TABLE [dbo].[application_pipeline] ADD [%s] NVARCHAR(MAX) NULL
			END
		`, col, col)
		_, err = DB.Exec(alterQuery)
		if err != nil {
			log.Fatalf("Failed to add column %s: %v", col, err)
		}
	}

	query = `
		IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[recruiters]') AND type in (N'U'))
		BEGIN
			CREATE TABLE [dbo].[recruiters] (
				[recruiter_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
				[recruiter_name] NVARCHAR(255) NOT NULL,
				[email] NVARCHAR(255) NOT NULL,
				[User_ID] NVARCHAR(255) NOT NULL,
				[status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
				[CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				CONSTRAINT [UQ_recruiters_UserID] UNIQUE ([User_ID])
			)
		END
	`
	_, err = DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to create recruiters table: %v", err)
	}

	alterQuery = `
		IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[recruiters]') AND name = 'UQ_recruiters_UserID')
		BEGIN
			ALTER TABLE [dbo].[recruiters] ADD CONSTRAINT [UQ_recruiters_UserID] UNIQUE ([User_ID])
		END
	`
	_, err = DB.Exec(alterQuery)
	if err != nil {
		log.Printf("Warning: could not add unique constraint to recruiters: %v", err)
	}

	for _, col := range []string{"CreatedAt", "UpdatedAt"} {
		alterQuery := fmt.Sprintf(`
			IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[recruiters]') AND name = '%s')
			BEGIN
				ALTER TABLE [dbo].[recruiters] ADD [%s] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
			END
		`, col, col)
		_, err = DB.Exec(alterQuery)
		if err != nil {
			log.Fatalf("Failed to add column %s to recruiters: %v", col, err)
		}
	}

	// Add stable recruiter relationships without removing or rewriting legacy name fields.
	for _, table := range []string{"application_pipeline", "requisition"} {
		alterQuery := fmt.Sprintf(`
			IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[%s]') AND name = 'Recruiter_ID')
				ALTER TABLE [dbo].[%s] ADD [Recruiter_ID] INT NULL
		`, table, table)
		if _, err = DB.Exec(alterQuery); err != nil {
			log.Fatalf("Failed to add Recruiter_ID to %s: %v", table, err)
		}
		backfillQuery := fmt.Sprintf(`
			;WITH UniqueRecruiterNames AS (
				SELECT LOWER(LTRIM(RTRIM([recruiter_name]))) AS normalized_name, MIN([recruiter_id]) AS recruiter_id
				FROM [dbo].[recruiters]
				WHERE NULLIF(LTRIM(RTRIM([recruiter_name])), '') IS NOT NULL
				GROUP BY LOWER(LTRIM(RTRIM([recruiter_name]))) HAVING COUNT(*) = 1
			)
			UPDATE target SET [Recruiter_ID] = names.recruiter_id
			FROM [dbo].[%s] target
			INNER JOIN UniqueRecruiterNames names
				ON LOWER(LTRIM(RTRIM(target.[Recruiter_Name]))) = names.normalized_name
			WHERE target.[Recruiter_ID] IS NULL
		`, table)
		if _, err = DB.Exec(backfillQuery); err != nil {
			log.Fatalf("Failed to backfill Recruiter_ID in %s: %v", table, err)
		}
		constraintName := "FK_" + table + "_recruiters"
		fkQuery := fmt.Sprintf(`
			IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = '%s')
				ALTER TABLE [dbo].[%s] WITH CHECK ADD CONSTRAINT [%s] FOREIGN KEY ([Recruiter_ID]) REFERENCES [dbo].[recruiters]([recruiter_id])
			IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[%s]') AND name = 'IX_%s_Recruiter_ID')
				CREATE INDEX [IX_%s_Recruiter_ID] ON [dbo].[%s]([Recruiter_ID])
		`, constraintName, table, constraintName, table, table, table, table)
		if _, err = DB.Exec(fkQuery); err != nil {
			log.Fatalf("Failed to add recruiter relationship to %s: %v", table, err)
		}
	}

	// Dashboard credentials are separate from the existing recruiter directory.
	usersQuery := `
		IF OBJECT_ID(N'[dbo].[dashboard_users]', N'U') IS NULL
		BEGIN
			CREATE TABLE [dbo].[dashboard_users] (
				[id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_dashboard_users] PRIMARY KEY,
				[recruiter_id] INT NULL,
				[email] NVARCHAR(255) NOT NULL,
				[password_hash] NVARCHAR(255) NOT NULL,
				[role] NVARCHAR(32) NOT NULL,
				[is_active] BIT NOT NULL CONSTRAINT [DF_dashboard_users_is_active] DEFAULT 1,
				[created_at] DATETIME2 NOT NULL CONSTRAINT [DF_dashboard_users_created_at] DEFAULT GETUTCDATE(),
				CONSTRAINT [FK_dashboard_users_recruiters] FOREIGN KEY ([recruiter_id]) REFERENCES [dbo].[recruiters]([recruiter_id]),
				CONSTRAINT [CK_dashboard_users_role] CHECK ([role] IN ('recruiter', 'superadmin')),
				CONSTRAINT [CK_dashboard_users_role_recruiter] CHECK (([role] = 'recruiter' AND [recruiter_id] IS NOT NULL) OR ([role] = 'superadmin' AND [recruiter_id] IS NULL))
			)
		END
		IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[dashboard_users]') AND name = 'UX_dashboard_users_email')
			CREATE UNIQUE INDEX [UX_dashboard_users_email] ON [dbo].[dashboard_users]([email])
		IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[dashboard_users]') AND name = 'UX_dashboard_users_recruiter')
			CREATE UNIQUE INDEX [UX_dashboard_users_recruiter] ON [dbo].[dashboard_users]([recruiter_id]) WHERE [recruiter_id] IS NOT NULL
	`
	if _, err = DB.Exec(usersQuery); err != nil {
		log.Fatalf("Failed to create dashboard_users: %v", err)
	}
	// Follow Up table
	query = `
    IF NOT EXISTS (
        SELECT *
        FROM sys.objects
        WHERE object_id = OBJECT_ID(N'[dbo].[follow_up]')
          AND type IN (N'U')
    )
    BEGIN
        CREATE TABLE [dbo].[follow_up] (
            [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            [Application_ID] NVARCHAR(255) NULL,
            [FollowUp_Time] DATETIME2 NULL,
            [FollowUp_Status] BIT NOT NULL DEFAULT 0,
            [FollowUp_Remarks] NVARCHAR(MAX) NULL,
            [FollowUp_By] NVARCHAR(255) NULL,
            [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
            [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        )
    END
`

	_, err = DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to create follow_up table: %v", err)
	}

	reqColumns := map[string]string{
		"Team":                 "NVARCHAR(255) NULL",
		"Hiring_Manager":       "NVARCHAR(255) NULL",
		"Priority":             "NVARCHAR(10) NULL",
		"Salary_Range":         "NVARCHAR(255) NULL",
		"Location":             "NVARCHAR(255) NULL",
		"Experience_Required":  "NVARCHAR(255) NULL",
		"Preferred_Industries": "NVARCHAR(MAX) NULL",
		"Must_Haves":           "NVARCHAR(MAX) NULL",
		"Knockout_Criteria":    "NVARCHAR(MAX) NULL",
		"Bottleneck_Type":      "NVARCHAR(255) NULL",
		"Pending_Since":        "DATETIME2 NULL",
		"Remarks":              "NVARCHAR(MAX) NULL",
		"Action_Owner":         "NVARCHAR(255) NULL",
	}
	for col, colType := range reqColumns {
		alterQuery := fmt.Sprintf(`
			IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requisition]') AND name = '%s')
			BEGIN
				ALTER TABLE [dbo].[requisition] ADD [%s] %s
			END
		`, col, col, colType)
		_, err = DB.Exec(alterQuery)
		if err != nil {
			log.Fatalf("Failed to add column %s to requisition: %v", col, err)
		}
	}

	appColumns := map[string]string{
		"Performance_Score":                       "DECIMAL(5,2) NULL",
		"Behaviour_Score":                         "DECIMAL(5,2) NULL",
		"Performance_Eval_Details":                "NVARCHAR(MAX) NULL",
		"Behaviour_Eval_Details":                  "NVARCHAR(MAX) NULL",
		"Retention_7d_Status":                     "NVARCHAR(50) NULL DEFAULT 'Pending'",
		"Retention_30d_Status":                    "NVARCHAR(50) NULL DEFAULT 'Pending'",
		"Is_30d_Failure":                          "BIT NULL DEFAULT 0",
		"Replacement_Required":                    "BIT NULL DEFAULT 0",
		"In_Talent_Bank":                          "BIT NULL DEFAULT 0",
		"Candidate_Attributes":                    "NVARCHAR(MAX) NULL",
		"External_Position":                       "NVARCHAR(500) NULL",
		"Internal_Designation":                    "NVARCHAR(500) NULL",
		"n_Round_Delay":                           "NVARCHAR(255) NULL",
		"n_Round_Delay_Reason":                    "NVARCHAR(255) NULL",
		"rd_Round_Delay":                          "NVARCHAR(255) NULL",
		"rd_Round_Delay_Reason":                   "NVARCHAR(255) NULL",
		"Breakup_Delay":                           "NVARCHAR(255) NULL",
		"Breakup_Delay_Reason":                    "NVARCHAR(255) NULL",
		"Delay":                                   "NVARCHAR(255) NULL",
		"Delay_Reason":                            "NVARCHAR(255) NULL",
		"Designation_Delay":                       "NVARCHAR(255) NULL",
		"Offer_letter_Delay":                      "NVARCHAR(255) NULL",
		"Offer_Letter_Delay_Reason":               "NVARCHAR(255) NULL",
		"Salary_Negotiation_Delay":                "NVARCHAR(255) NULL",
		"Salary_Negotiation_Delay_Reason":         "NVARCHAR(255) NULL",
		"First_Round_Drop_Off_Reason":             "NVARCHAR(500) NULL",
		"nd_Round_Drop_Off_Reason":                "NVARCHAR(500) NULL",
		"rd_Round_Drop_Off_Reason":                "NVARCHAR(500) NULL",
		"Background_Verification":                 "NVARCHAR(100) NULL",
		"Background_Verification_Drop_Off_Reason": "NVARCHAR(500) NULL",
		"Telecalling_Date_Time":                   "NVARCHAR(255) NULL",
		"First_Round_Date_Time":                   "NVARCHAR(255) NULL",
		"Second_Round_Date_Time":                  "NVARCHAR(255) NULL",
		"Third_Round_Date_Time":                   "NVARCHAR(255) NULL",
		"Salary_Negotiation_Date_Time":            "NVARCHAR(255) NULL",
		"Appointment_Letter_Date_Time":            "NVARCHAR(255) NULL",
		"Joining_Date_Time":                       "NVARCHAR(255) NULL",
		"Date_of_Joining":                         "NVARCHAR(255) NULL",
		"Hiring_Date_Time":                        "NVARCHAR(255) NULL",
		"Qualified_Date_Time":                     "NVARCHAR(255) NULL",
		"Approval_Remarks":                        "NVARCHAR(MAX) NULL",
		"First_Round_Feedback":                    "NVARCHAR(MAX) NULL",
		"Manager_Round_Feedback":                  "NVARCHAR(MAX) NULL",
		"Directorial_Round_Feedback":              "NVARCHAR(MAX) NULL",
		"Salary_Negotiation_Drop_Off_Reason":      "NVARCHAR(500) NULL",
		"First_Interview_Status":                  "NVARCHAR(100) NULL",
		"Final_Round_Review_Status":               "NVARCHAR(100) NULL",
		"rd_Directorial_Round_Status":             "NVARCHAR(100) NULL",
	}
	for col, colType := range appColumns {
		alterQuery := fmt.Sprintf(`
			IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[application_pipeline]') AND name = '%s')
			BEGIN
				ALTER TABLE [dbo].[application_pipeline] ADD [%s] %s
			END
		`, col, col, colType)
		_, err = DB.Exec(alterQuery)
		if err != nil {
			log.Fatalf("Failed to add column %s to application_pipeline: %v", col, err)
		}
	}

	// Add High Performance Database Indexes for Fast API Queries
	indexQueries := []string{
		`IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_app_pipeline_created' AND object_id = OBJECT_ID('dbo.application_pipeline'))
		 BEGIN
			CREATE INDEX IX_app_pipeline_created ON [dbo].[application_pipeline]([Application_Created_Time] DESC);
		 END`,
		`IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_app_pipeline_job' AND object_id = OBJECT_ID('dbo.application_pipeline'))
		 BEGIN
			CREATE INDEX IX_app_pipeline_job ON [dbo].[application_pipeline]([Job_Opening_ID]);
		 END`,
		`IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_app_pipeline_status' AND object_id = OBJECT_ID('dbo.application_pipeline'))
		 BEGIN
			CREATE INDEX IX_app_pipeline_status ON [dbo].[application_pipeline]([Application_Status]);
		 END`,
		`IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_requisition_dept' AND object_id = OBJECT_ID('dbo.requisition'))
		 BEGIN
			CREATE INDEX IX_requisition_dept ON [dbo].[requisition]([Department]);
		 END`,
	}
	for _, idxQ := range indexQueries {
		_, _ = DB.Exec(idxQ)
	}

	fmt.Println("Migrations & Indexes completed successfully")
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
