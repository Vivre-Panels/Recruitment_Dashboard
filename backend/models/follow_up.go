package models

import "time"

type FollowUp struct {
	ID              *int64    `json:"id" db:"Id"`
	ApplicationID   *string   `json:"Application_ID" db:"Application_ID"`
	FollowUpTime    *string   `json:"FollowUp_Time" db:"FollowUp_Time"`
	FollowUpStatus  *bool     `json:"FollowUp_Status" db:"FollowUp_Status"`
	FollowUpRemarks *string   `json:"FollowUp_Remarks" db:"FollowUp_Remarks"`
	FollowUpBy      *string   `json:"FollowUp_By" db:"FollowUp_By"`
	CreatedAt       time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt       time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
