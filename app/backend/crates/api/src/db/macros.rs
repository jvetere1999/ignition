//! Database model macros for reducing boilerplate
//!
//! This module provides macros for common patterns in database models,
//! particularly for status/mode enums that require string conversion implementations.

/// Macro to reduce status/mode enum boilerplate
///
/// Creates an enum with automatic implementations for:
/// - `as_str()` method
/// - `FromStr` trait
/// - `Display` trait
/// - `Serialize` and `Deserialize` via serde
///
/// # Example
///
/// ```ignore
/// named_enum!(QuestStatus {
///     Available => "available",
///     Accepted => "accepted",
///     InProgress => "in_progress",
///     Completed => "completed",
/// });
/// ```
#[macro_export]
macro_rules! named_enum {
    (
        $name:ident {
            $($variant:ident => $string:expr),+
            $(,)?
        }
    ) => {
        /// Enum with string representation and serde support
        #[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
        #[serde(rename_all = "snake_case")]
        pub enum $name {
            $($variant),+
        }

        impl $name {
            /// Get string representation of this enum variant
            pub fn as_str(&self) -> &'static str {
                match self {
                    $($name::$variant => $string),+
                }
            }
        }

        impl std::str::FromStr for $name {
            type Err = String;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    $($string => Ok($name::$variant)),+,
                    _ => Err(format!("Unknown {}: {}", stringify!($name), s))
                }
            }
        }

        impl std::fmt::Display for $name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self.as_str())
            }
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_named_enum_as_str() {
        named_enum!(TestStatus {
            Active => "active",
            Inactive => "inactive"
        });

        assert_eq!(TestStatus::Active.as_str(), "active");
        assert_eq!(TestStatus::Inactive.as_str(), "inactive");
    }

    #[test]
    fn test_named_enum_from_str() {
        use std::str::FromStr;

        named_enum!(TestStatus {
            Active => "active",
            Inactive => "inactive"
        });

        assert_eq!(TestStatus::from_str("active").ok(), Some(TestStatus::Active));
        assert_eq!(TestStatus::from_str("inactive").ok(), Some(TestStatus::Inactive));
        assert!(TestStatus::from_str("unknown").is_err());
    }

    #[test]
    fn test_named_enum_display() {
        use std::fmt::Display;

        named_enum!(TestStatus {
            Active => "active",
            Inactive => "inactive"
        });

        assert_eq!(TestStatus::Active.to_string(), "active");
        assert_eq!(TestStatus::Inactive.to_string(), "inactive");
    }
}
