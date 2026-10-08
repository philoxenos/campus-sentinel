package service

import (
	"errors"
	"regexp"
	"strings"
)

var harmfulWords = []string{
	// English violence / threats / harassment
	"kill", "shoot", "gun", "bomb", "stab", "hurt", "die", "suicide", "murder",
	"hate", "punch", "assault", "fight", "idiot", "moron", "stupid", "loser",
	"ugly", "bitch", "bastard", "fuck", "shit", "damn", "crap", "threat",
	
	// Tagalog violence / profanity / bullying
	"patay", "patayin", "baril", "barilin", "bomba", "saksak", "saksakin",
	"sapak", "bugbog", "bugbugin", "gago", "tanga", "bobo", "inutil", "ulol",
	"puta", "putangina", "tangina", "pakyu", "leche", "tarantado", "hayop",
	"punyeta", "kupal", "pokpok", "buwisit",
}

// CheckHarmfulContent inspects text for harmful, violent, or profane language.
// Returns an error if any prohibited term is detected.
func CheckHarmfulContent(text string) error {
	normalized := strings.ToLower(text)
	
	// Clean punctuation for word boundary check
	reg := regexp.MustCompile(`[^a-zA-Z0-9\s]`)
	cleaned := reg.ReplaceAllString(normalized, " ")
	tokens := strings.Fields(cleaned)

	tokenMap := make(map[string]bool)
	for _, t := range tokens {
		tokenMap[t] = true
	}

	for _, word := range harmfulWords {
		if tokenMap[word] {
			return errors.New("Harmful or violent words detected. The Kudos Wall is reserved for uplifting messages only.")
		}
		// Also detect substring matches for critical severe threats
		if len(word) > 4 && strings.Contains(normalized, word) {
			return errors.New("Harmful or violent words detected. The Kudos Wall is reserved for uplifting messages only.")
		}
	}

	return nil
}
