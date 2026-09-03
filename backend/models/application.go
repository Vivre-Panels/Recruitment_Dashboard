package models

import "time"

type Application struct {
	ID                   *int64   `json:"id" db:"Id"`
	ApplicationID        *string  `json:"Application_ID" db:"Application_ID"`
	ApplicationCreatedTime *string `json:"Application_Created_Time" db:"Application_Created_Time"`
	ApplicationStatus    *string  `json:"Application_Status" db:"Application_Status"`
	CallAuditScore       *string `json:"Call_Audit_Score" db:"Call_Audit_Score"`
	CallPriority         *string `json:"Call_Priority" db:"Call_Priority"`
	CandidateName        *string `json:"Candidate_Name" db:"Candidate_Name"`
	CVLink               *string `json:"CV_Link" db:"CV_Link"`
	CVScore              *string `json:"CV_Score" db:"CV_Score"`
	JobOpeningID         interface{} `json:"Job_Opening_ID" db:"Job_Opening_ID"`
	Mobile               *string  `json:"Mobile" db:"Mobile"`
	PostingTitle         *string  `json:"Posting_Title" db:"Posting_Title"`
	Department           *string  `json:"Department" db:"Department"`
	Team                 *string  `json:"Team" db:"Team"`
	RecruiterName        *string  `json:"Recruiter_Name" db:"Recruiter_Name"`
	Source               *string  `json:"Source" db:"Source"`
	ProfileSummary       *string  `json:"Profile_Summary" db:"Profile_Summary"`
	TellecallingFeedback        *string `json:"Tellecalling_Feedback" db:"Tellecalling_Feedback"`
	TelleCallingTime            *string `json:"TelleCalling_Time" db:"TelleCalling_Time"`
	TellecallingStatus          *string `json:"Tellecalling_Status" db:"Tellecalling_Status"`
	OfferAcceptedDateTime        *string `json:"Offer_Accepted_DateTime" db:"Offer_Accepted_DateTime"`
	ManagerInterviewDateTime    *string `json:"Manager_Interview_DateTime" db:"Manager_Interview_DateTime"`
	ManagerRoundScheduleDateTime *string `json:"Manager_Round_Schedule_DateTime" db:"Manager_Round_Schedule_DateTime"`
	ManagerRoundCompletedTime   *string  `json:"Manager_Round_Completed_Time" db:"Manager_Round_Completed_Time"`
	CallDuration                *float64 `json:"Call_Duration" db:"Call_Duration"`

	// Separate Score Evaluations
	PerformanceScore       *float64 `json:"Performance_Score" db:"Performance_Score"`
	BehaviourScore         *float64 `json:"Behaviour_Score" db:"Behaviour_Score"`
	PerformanceEvalDetails *string  `json:"Performance_Eval_Details" db:"Performance_Eval_Details"`
	BehaviourEvalDetails   *string  `json:"Behaviour_Eval_Details" db:"Behaviour_Eval_Details"`

	// Retention & Post-Hire Metrics
	Retention7dStatus   *string `json:"Retention_7d_Status" db:"Retention_7d_Status"`
	Retention30dStatus   *string `json:"Retention_30d_Status" db:"Retention_30d_Status"`
	Is30dFailure         *bool   `json:"Is_30d_Failure" db:"Is_30d_Failure"`
	ReplacementRequired  *bool   `json:"Replacement_Required" db:"Replacement_Required"`

	// Talent Bank
	InTalentBank        *bool   `json:"In_Talent_Bank" db:"In_Talent_Bank"`
	CandidateAttributes *string `json:"Candidate_Attributes" db:"Candidate_Attributes"`

	CreatedAt                   time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt                   time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
