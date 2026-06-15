package domain

import "regexp"

var sha256Pattern = regexp.MustCompile(`^[a-f0-9]{64}$`)

func IsValidSHA256(value string) bool {
	return sha256Pattern.MatchString(value)
}
