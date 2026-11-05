package models

import "time"

type Application struct {
	ID                                  *int64      `json:"id" db:"Id"`
	ApplicationID                       *string     `json:"Application_ID" db:"Application_ID"`
	ApplicationCreatedTime              *string     `json:"Application_Created_Time" db:"Application_Created_Time"`
	ApplicationStatus                   *string     `json:"Application_Status" db:"Application_Status"`
	CallAuditScore                      *string     `json:"Call_Audit_Score" db:"Call_Audit_Score"`
	CallPriority                        *string     `json:"Call_Priority" db:"Call_Priority"`
	CandidateName                       *string     `json:"Candidate_Name" db:"Candidate_Name"`
	CVLink                              *string     `json:"CV_Link" db:"CV_Link"`
	CVScore                             *string     `json:"CV_Score" db:"CV_Score"`
	JobOpeningID                        interface{} `json:"Job_Opening_ID" db:"Job_Opening_ID"`
	Mobile                              *string     `json:"Mobile" db:"Mobile"`
	PostingTitle                        *string     `json:"Posting_Title" db:"Posting_Title"`
	ExternalPosition                    *string     `json:"External_Position" db:"External_Position"`
	InternalDesignation                 *string     `json:"Internal_Designation" db:"Internal_Designation"`
	Department                          *string     `json:"Department" db:"Department"`
	PositionOpeningDate                 *string     `json:"Position_Opening_Date" db:"Position_Opening_Date"`
	Team                                *string     `json:"Team" db:"Team"`
	RecruiterName                       *string     `json:"Recruiter_Name" db:"Recruiter_Name"`
	Source                              *string     `json:"Source" db:"Source"`
	ProfileSummary                      *string     `json:"Profile_Summary" db:"Profile_Summary"`
	TellecallingFeedback                *string     `json:"Tellecalling_Feedback" db:"Tellecalling_Feedback"`
	InterviewFeedback                   *string     `json:"Interview_Feedback" db:"-"`
	ApprovalRemarks                     *string     `json:"Approval_Remarks" db:"Approval_Remarks"`
	FirstRoundFeedback                  *string     `json:"First_Round_Feedback" db:"First_Round_Feedback"`
	ManagerRoundFeedback                *string     `json:"Manager_Round_Feedback" db:"Manager_Round_Feedback"`
	DirectorialRoundFeedback            *string     `json:"Directorial_Round_Feedback" db:"Directorial_Round_Feedback"`
	TelleCallingTime                    *string     `json:"TelleCalling_Time" db:"TelleCalling_Time"`
	TellecallingStatus                  *string     `json:"Tellecalling_Status" db:"Tellecalling_Status"`
	OfferAcceptedDateTime               *string     `json:"Offer_Accepted_DateTime" db:"Offer_Accepted_DateTime"`
	ManagerInterviewDateTime            *string     `json:"Manager_Interview_DateTime" db:"Manager_Interview_DateTime"`
	ManagerRoundScheduleDateTime        *string     `json:"Manager_Round_Schedule_DateTime" db:"Manager_Round_Schedule_DateTime"`
	ManagerRoundCompletedTime           *string     `json:"Manager_Round_Completed_Time" db:"Manager_Round_Completed_Time"`
	NRoundDelay                         *string     `json:"n_Round_Delay" db:"n_Round_Delay"`
	NRoundDelayReason                   *string     `json:"n_Round_Delay_Reason" db:"n_Round_Delay_Reason"`
	RDRoundDelay                        *string     `json:"rd_Round_Delay" db:"rd_Round_Delay"`
	RDRoundDelayReason                  *string     `json:"rd_Round_Delay_Reason" db:"rd_Round_Delay_Reason"`
	BreakupDelay                        *string     `json:"Breakup_Delay" db:"Breakup_Delay"`
	BreakupDelayReason                  *string     `json:"Breakup_Delay_Reason" db:"Breakup_Delay_Reason"`
	Delay                               *string     `json:"Delay" db:"Delay"`
	DelayReason                         *string     `json:"Delay_Reason" db:"Delay_Reason"`
	DesignationDelay                    *string     `json:"Designation_Delay" db:"Designation_Delay"`
	OfferLetterDelay                    *string     `json:"Offer_letter_Delay" db:"Offer_letter_Delay"`
	OfferLetterDelayReason              *string     `json:"Offer_Letter_Delay_Reason" db:"Offer_Letter_Delay_Reason"`
	SalaryNegotiationDelay              *string     `json:"Salary_Negotiation_Delay" db:"Salary_Negotiation_Delay"`
	SalaryNegotiationDelayReason        *string     `json:"Salary_Negotiation_Delay_Reason" db:"Salary_Negotiation_Delay_Reason"`
	SalaryNegotiationDropOffReason      *string     `json:"Salary_Negotiation_Drop_Off_Reason" db:"Salary_Negotiation_Drop_Off_Reason"`
	FirstRoundDropOffReason             *string     `json:"First_Round_Drop_Off_Reason" db:"First_Round_Drop_Off_Reason"`
	SecondRoundDropOffReason            *string     `json:"nd_Round_Drop_Off_Reason" db:"nd_Round_Drop_Off_Reason"`
	ThirdRoundDropOffReason             *string     `json:"rd_Round_Drop_Off_Reason" db:"rd_Round_Drop_Off_Reason"`
	BackgroundVerification              *string     `json:"Background_Verification" db:"Background_Verification"`
	BackgroundVerificationDropOffReason *string     `json:"Background_Verification_Drop_Off_Reason" db:"Background_Verification_Drop_Off_Reason"`
	TelecallingDateTime                 *string     `json:"Telecalling_Date_Time" db:"Telecalling_Date_Time"`
	FirstRoundDateTime                  *string     `json:"First_Round_Date_Time" db:"First_Round_Date_Time"`
	SecondRoundDateTime                 *string     `json:"Second_Round_Date_Time" db:"Second_Round_Date_Time"`
	ThirdRoundDateTime                  *string     `json:"Third_Round_Date_Time" db:"Third_Round_Date_Time"`
	SalaryNegotiationDateTime           *string     `json:"Salary_Negotiation_Date_Time" db:"Salary_Negotiation_Date_Time"`
	AppointmentLetterDateTime           *string     `json:"Appointment_Letter_Date_Time" db:"Appointment_Letter_Date_Time"`
	JoiningDateTime                     *string     `json:"Joining_Date_Time" db:"Joining_Date_Time"`
	DateOfJoining                       *string     `json:"Date_of_Joining" db:"Date_of_Joining"`
	HiringDateTime                      *string     `json:"Hiring_Date_Time" db:"Hiring_Date_Time"`
	QualifiedDateTime                   *string     `json:"Qualified_Date_Time" db:"Qualified_Date_Time"`
	FirstInterviewStatus                *string     `json:"First_Interview_Status" db:"First_Interview_Status"`
	SecondRoundStatus                   *string     `json:"Final_Round_Review_Status" db:"Final_Round_Review_Status"`
	ThirdRoundStatus                    *string     `json:"rd_Directorial_Round_Status" db:"rd_Directorial_Round_Status"`
	CallDuration                        *float64    `json:"Call_Duration" db:"Call_Duration"`

	// Follow up
	FollowUp []FollowUp `json:"FollowUp"`

	// Separate Score Evaluations
	PerformanceScore       *float64 `json:"Performance_Score" db:"Performance_Score"`
	BehaviourScore         *float64 `json:"Behaviour_Score" db:"Behaviour_Score"`
	PerformanceEvalDetails *string  `json:"Performance_Eval_Details" db:"Performance_Eval_Details"`
	BehaviourEvalDetails   *string  `json:"Behaviour_Eval_Details" db:"Behaviour_Eval_Details"`

	// Retention & Post-Hire Metrics
	Retention7dStatus   *string `json:"Retention_7d_Status" db:"Retention_7d_Status"`
	Retention30dStatus  *string `json:"Retention_30d_Status" db:"Retention_30d_Status"`
	Is30dFailure        *bool   `json:"Is_30d_Failure" db:"Is_30d_Failure"`
	ReplacementRequired *bool   `json:"Replacement_Required" db:"Replacement_Required"`

	// Talent Bank
	InTalentBank        *bool   `json:"In_Talent_Bank" db:"In_Talent_Bank"`
	CandidateAttributes *string `json:"Candidate_Attributes" db:"Candidate_Attributes"`

	CreatedAt time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
