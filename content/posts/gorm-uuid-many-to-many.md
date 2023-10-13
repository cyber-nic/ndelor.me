---
title: "Gorm UUID Many to Many"
date: 2023-10-05T13:45:40+01:00
lastmod: 2023-10-16T13:25:51+01:00
tags: ["go"]
draft: false
---

Hasham Ali's [How to Use UUID Key Type with Gorm](https://medium.com/@the.hasham.ali/how-to-use-uuid-key-type-with-gorm-cc00d4ec7100) article was terrific for suggesting how to handle using UUID as the ID in gorm. It took a little more fiddling to be able to use the keys in a many-to-many
relationship. In the end, it worked by having to explicitly define the join table and the foreign key constraints. Sample code is below.

```go
import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BaseAttributes contains common columns for all tables.
// This will replace the default gorm.Model : https://pkg.go.dev/gorm.io/gorm@v1.25.4#Model
// and in this specific case will replace the uint id type with uuid.
type BaseAttributes struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `sql:"index"`
}

// BeforeCreate is a gorm hook to auto-set a UUID at objection creation time.
// https://gorm.io/docs/hooks.html
func (base *BaseGormUUID) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New())
	return nil
}

type User struct {
	BaseAttributes
	Email      string `json:"email"`
	Username   string `json:"username"`
}

// Organization is the representation of an organization model. It
type Organization struct {
	BaseAttributes
	Name        string    `json:"name"`
	CreatedBy   uuid.UUID `json:"createdBy"`
	Users       []User    `json:"users"    gorm:"many2many:organization_users"`
}

// OrganizationUsers is a many-to-many join table between Organization and User. It is created explicitely so as to
// help define the foreign key constraints.
type OrganizationUsers struct {
	BaseAttributes
	Organization   Organization
	OrganizationID uuid.UUID `gorm:"primaryKey"`
	User           User
	UserID         uuid.UUID `gorm:"primaryKey"`
}
```
