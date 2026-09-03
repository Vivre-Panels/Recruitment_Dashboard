package models

import "time"

type Requisition struct {
	ID            *int64    `json:"id" db:"Id"`
	JobOpeningID  interface{} `json:"Job_Opening_ID" db:"Job_Opening_ID"`
	RequisitionID interface{} `json:"Requisition_ID" db:"Requisition_ID"`
	Department    *string   `json:"Department" db:"Department"`
	Team          *string   `json:"Team" db:"Team"`
	JobDescription *string  `json:"Job_Description" db:"Job_Description"`
	JobTitle      *string   `json:"Job_Title" db:"Job_Title"`
	NoOfOpenings  interface{} `json:"No_Of_Openings" db:"No_Of_Openings"`
	OpeningDate   *string   `json:"Opening_Date" db:"Opening_Date"`
	RecruiterName *string   `json:"Recruiter_Name" db:"Recruiter_Name"`
	Status        *string   `json:"Status" db:"Status"`
	TargetDate    *string   `json:"Target_Date" db:"Target_Date"`

	// New Management & Requirement Card Fields
	HiringManager       *string `json:"Hiring_Manager" db:"Hiring_Manager"`
	Priority            *string `json:"Priority" db:"Priority"`
	SalaryRange         *string `json:"Salary_Range" db:"Salary_Range"`
	Location            *string `json:"Location" db:"Location"`
	ExperienceRequired  *string `json:"Experience_Required" db:"Experience_Required"`
	PreferredIndustries *string `json:"Preferred_Industries" db:"Preferred_Industries"`
	MustHaves           *string `json:"Must_Haves" db:"Must_Haves"`
	KnockoutCriteria    *string `json:"Knockout_Criteria" db:"Knockout_Criteria"`

	// Bottleneck Fields
	BottleneckType      *string `json:"Bottleneck_Type" db:"Bottleneck_Type"`
	PendingSince        *string `json:"Pending_Since" db:"Pending_Since"`
	Remarks             *string `json:"Remarks" db:"Remarks"`
	ActionOwner         *string `json:"Action_Owner" db:"Action_Owner"`

	CreatedAt     time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt     time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
