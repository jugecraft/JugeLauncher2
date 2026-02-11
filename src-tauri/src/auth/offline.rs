use super::Account;

pub fn login(username: &str) -> Account {
    Account::new_offline(username)
}
