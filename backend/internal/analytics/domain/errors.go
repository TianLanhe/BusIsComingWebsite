package domain

import "fmt"

// ValidationError deliberately identifies only a bounded field and rule. It never
// carries request input, which keeps callers from accidentally logging sensitive data.
type ValidationError struct {
	Field string
	Rule  string
}

func (err ValidationError) Error() string {
	return fmt.Sprintf("analytics validation failed: %s %s", err.Field, err.Rule)
}

func invalid(field, rule string) error {
	return ValidationError{Field: field, Rule: rule}
}
