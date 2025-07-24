module.exports = {
  //users
  "users.read": ["admin", "user"],
  "users.write": ["admin", "user"],
  "users.delete": ["admin", "user"],
  "users.export": ["admin", "user"],
  //doctors
  "doctors.read": ["admin", "user"],
  "doctors.write": ["admin", "user"],
  "doctors.delete": ["admin", "user"],
  "doctors.export": ["admin", "user"],
  //dashboards
  "dashboard.read": ["admin", "user"],
  //reports
  "reports.read": ["admin", "user"],
  //roles
  "roles.read": ["super_admin", "admin", "branch_admin", "user"],
};
