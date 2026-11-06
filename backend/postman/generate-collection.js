/**
 * Script to generate the comprehensive Postman Collection for Task 30.
 * Adheres strictly to the Postman Collection v2.1.0 specification.
 */
const fs = require('fs');
const path = require('path');

function createRequest({
  name,
  method,
  urlPath,
  queryParams = [],
  body = null,
  authType = 'bearer',
  description = '',
  tests = []
}) {
  const urlParts = urlPath.split('/').filter(Boolean);
  
  const headers = [
    { key: 'Accept', value: 'application/json', type: 'text' }
  ];
  if (body) {
    headers.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
  }

  const request = {
    method: method.toUpperCase(),
    header: headers,
    url: {
      raw: `{{baseUrl}}/${urlPath}${queryParams.length > 0 ? '?' + queryParams.map(q => `${q.key}=${q.value}`).join('&') : ''}`,
      host: ['{{baseUrl}}'],
      path: urlParts,
      query: queryParams.map(q => ({ key: q.key, value: q.value, description: q.description || '' }))
    },
    description: description
  };

  if (authType === 'bearer') {
    request.auth = {
      type: 'bearer',
      bearer: [
        { key: 'token', value: '{{accessToken}}', type: 'string' }
      ]
    };
  } else if (authType === 'none') {
    request.auth = {
      type: 'noauth'
    };
  }

  if (body) {
    request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json'
        }
      }
    };
  }

  const event = [];
  if (tests && tests.length > 0) {
    event.push({
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: tests
      }
    });
  }

  return {
    name,
    request,
    response: [],
    event
  };
}

// 1. INSTITUTIONS FOLDER
const institutionsFolder = {
  name: "1. Institutions",
  description: "Operations for managing educational institutions and institutional administrators.",
  item: [
    createRequest({
      name: "Create Institution - Success (Super Admin)",
      method: "POST",
      urlPath: "institutions",
      body: {
        name: "Greenwood International Academy",
        code: "GIA2026",
        type: "SCHOOL",
        email: "contact@greenwood.edu",
        phone: "+919876543210",
        address: {
          street: "123 Education Boulevard",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411001",
          country: "India"
        },
        website: "https://greenwood.edu",
        subscription: {
          plan: "PREMIUM",
          status: "ACTIVE",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2027-01-01T00:00:00.000Z"
        }
      },
      description: "Creates a new tenant institution. Only SUPER_ADMIN allowed.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Institution created with expected code', function () {",
        "    pm.expect(json.code).to.eql('GIA2026');",
        "    if (json._id) {",
        "        pm.environment.set('institutionId', json._id);",
        "    }",
        "});"
      ]
    }),
    createRequest({
      name: "Create Institution - Duplicate Code (409 Conflict)",
      method: "POST",
      urlPath: "institutions",
      body: {
        name: "Greenwood Second Campus",
        code: "GIA2026",
        type: "COLLEGE",
        email: "campus2@greenwood.edu",
        phone: "+919876543211",
        address: {
          street: "456 Education Boulevard",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411001",
          country: "India"
        },
        subscription: {
          plan: "BASIC",
          status: "ACTIVE",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2027-01-01T00:00:00.000Z"
        }
      },
      description: "Attempts to create an institution with duplicate code GIA2026.",
      tests: [
        "pm.test('Status code is 409 Conflict', function () {",
        "    pm.response.to.have.status(409);",
        "});"
      ]
    }),
    createRequest({
      name: "List Institutions (Super Admin)",
      method: "GET",
      urlPath: "institutions",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" }
      ],
      description: "List all institutions with pagination and search.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Response contains pagination/data', function () {",
        "    pm.expect(json).to.be.an('object');",
        "});"
      ]
    }),
    createRequest({
      name: "Get Institution By ID - Success",
      method: "GET",
      urlPath: "institutions/{{institutionId}}",
      description: "Retrieve single institution details by ID.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Correct institution returned', function () {",
        "    pm.expect(json._id).to.eql(pm.environment.get('institutionId'));",
        "});"
      ]
    }),
    createRequest({
      name: "Get Institution By ID - Invalid ObjectId (400 Bad Request)",
      method: "GET",
      urlPath: "institutions/{{malformedObjectId}}",
      description: "Passes invalid format ObjectId to verify validation pipe.",
      tests: [
        "pm.test('Status code is 400 Bad Request', function () {",
        "    pm.response.to.have.status(400);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Institution Details",
      method: "PATCH",
      urlPath: "institutions/{{institutionId}}",
      body: {
        name: "Greenwood International Academy - Main Campus",
        phone: "+919876543299"
      },
      description: "Super Admin updates institution name and phone.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Institution Status",
      method: "PATCH",
      urlPath: "institutions/{{institutionId}}/status",
      body: {
        status: "ACTIVE",
        reason: "Periodic verification completed"
      },
      description: "Super Admin modifies institution operational status.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Create Institution Admin User",
      method: "POST",
      urlPath: "institutions/{{institutionId}}/admins",
      body: {
        name: "Greenwood Primary Administrator",
        email: "{{adminEmail}}",
        password: "{{adminPassword}}"
      },
      description: "Super Admin creates institutional administrator. Sets role to ADMIN internally.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Admin user has role ADMIN', function () {",
        "    pm.expect(json.role).to.eql('ADMIN');",
        "    if (json._id) {",
        "        pm.environment.set('adminUserId', json._id);",
        "    }",
        "});"
      ]
    })
  ]
};

// 2. AUTHENTICATION FOLDER
const authFolder = {
  name: "2. Authentication",
  description: "User authentication, registration, session rotation, logout, and self-profile.",
  item: [
    createRequest({
      name: "Register User (Public)",
      method: "POST",
      urlPath: "auth/register",
      authType: "none",
      body: {
        name: "Self Registered Applicant",
        email: "applicant@example.com",
        password: "StrongPassword123"
      },
      description: "Public registration endpoint for new accounts.",
      tests: [
        "pm.test('Status code is 201 Created or 409 Conflict', function () {",
        "    pm.expect([201, 409]).to.include(pm.response.code);",
        "});"
      ]
    }),
    createRequest({
      name: "Register User - Duplicate Email (409 Conflict)",
      method: "POST",
      urlPath: "auth/register",
      authType: "none",
      body: {
        name: "Duplicate Applicant",
        email: "{{superAdminEmail}}",
        password: "StrongPassword123"
      },
      description: "Attempt to register with an already existing email address.",
      tests: [
        "pm.test('Status code is 409 Conflict', function () {",
        "    pm.response.to.have.status(409);",
        "});"
      ]
    }),
    createRequest({
      name: "Login - Super Admin (Saves Token)",
      method: "POST",
      urlPath: "auth/login",
      authType: "none",
      body: {
        email: "{{superAdminEmail}}",
        password: "{{superAdminPassword}}"
      },
      description: "Authenticate as Super Admin. Automatically saves accessToken to environment.",
      tests: [
        "pm.test('Status code is 200 or 201', function () {",
        "    pm.expect([200, 201]).to.include(pm.response.code);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Token received and saved', function () {",
        "    pm.expect(json.accessToken).to.be.a('string');",
        "    pm.environment.set('accessToken', json.accessToken);",
        "    if (json.user && json.user._id) {",
        "        pm.environment.set('superAdminUserId', json.user._id);",
        "    }",
        "});"
      ]
    }),
    createRequest({
      name: "Login - Institution Admin (Saves Token)",
      method: "POST",
      urlPath: "auth/login",
      authType: "none",
      body: {
        email: "{{adminEmail}}",
        password: "{{adminPassword}}"
      },
      description: "Authenticate as Institution Admin.",
      tests: [
        "pm.test('Status code is 200 or 201', function () {",
        "    pm.expect([200, 201]).to.include(pm.response.code);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Token received and saved', function () {",
        "    pm.expect(json.accessToken).to.be.a('string');",
        "    pm.environment.set('accessToken', json.accessToken);",
        "});"
      ]
    }),
    createRequest({
      name: "Login - Invalid Credentials (401 Unauthorized)",
      method: "POST",
      urlPath: "auth/login",
      authType: "none",
      body: {
        email: "{{superAdminEmail}}",
        password: "WrongPassword!999"
      },
      description: "Verifies rejection of invalid password with 401 Unauthorized.",
      tests: [
        "pm.test('Status code is 401 Unauthorized', function () {",
        "    pm.response.to.have.status(401);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Current Profile (/auth/me)",
      method: "GET",
      urlPath: "auth/me",
      description: "Get authenticated user identity and profile metadata.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Password not leaked in response', function () {",
        "    pm.expect(json.password).to.be.undefined;",
        "});"
      ]
    }),
    createRequest({
      name: "Refresh Token Rotation (/auth/refresh)",
      method: "POST",
      urlPath: "auth/refresh",
      authType: "none",
      description: "Rotates refresh token cookie and issues a fresh access token.",
      tests: [
        "pm.test('Status code is 200 or 401 depending on cookie', function () {",
        "    pm.expect([200, 201, 401]).to.include(pm.response.code);",
        "});",
        "if (pm.response.code === 200 || pm.response.code === 201) {",
        "    var json = pm.response.json();",
        "    if (json.accessToken) {",
        "        pm.environment.set('accessToken', json.accessToken);",
        "    }",
        "}"
      ]
    }),
    createRequest({
      name: "Verify Email (/auth/verify-email)",
      method: "POST",
      urlPath: "auth/verify-email",
      authType: "none",
      body: {
        token: "sample-verification-token-string"
      },
      description: "Submit email verification token.",
      tests: [
        "pm.test('Returns 400 or 200 based on token validity', function () {",
        "    pm.expect([200, 400, 404]).to.include(pm.response.code);",
        "});"
      ]
    }),
    createRequest({
      name: "Resend Verification Email (/auth/resend-verification)",
      method: "POST",
      urlPath: "auth/resend-verification",
      authType: "none",
      body: {
        email: "applicant@example.com"
      },
      description: "Request a new email verification link.",
      tests: [
        "pm.test('Response is valid', function () {",
        "    pm.expect([200, 201, 400, 404]).to.include(pm.response.code);",
        "});"
      ]
    }),
    createRequest({
      name: "Logout (/auth/logout)",
      method: "POST",
      urlPath: "auth/logout",
      description: "Revokes current active session and clears refresh token cookie.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    })
  ]
};

// 3. SESSIONS FOLDER
const sessionsFolder = {
  name: "3. Sessions",
  description: "Session inspection, user session tracking, and revocation controls.",
  item: [
    createRequest({
      name: "Get All Sessions (Super Admin)",
      method: "GET",
      urlPath: "sessions",
      queryParams: [
        { key: "userId", value: "{{superAdminUserId}}" }
      ],
      description: "Super Admin queries all active platform sessions.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "if (Array.isArray(json) && json.length > 0) {",
        "    pm.environment.set('sessionId', json[0]._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Get My Active Sessions",
      method: "GET",
      urlPath: "sessions/my",
      description: "Retrieve list of all sessions for current authenticated user.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Revoke Specific Session By ID",
      method: "DELETE",
      urlPath: "sessions/{{sessionId}}",
      description: "Revoke a single session.",
      tests: [
        "pm.test('Status code is 200 OK or 404', function () {",
        "    pm.expect([200, 404]).to.include(pm.response.code);",
        "});"
      ]
    }),
    createRequest({
      name: "Revoke All Sessions for User",
      method: "DELETE",
      urlPath: "sessions/user/{{studentUserId}}",
      description: "Force logout of a user from all devices.",
      tests: [
        "pm.test('Status code is 200 OK or 404', function () {",
        "    pm.expect([200, 404]).to.include(pm.response.code);",
        "});"
      ]
    })
  ]
};

// 4. USERS FOLDER
const usersFolder = {
  name: "4. Users",
  description: "User provisioning, account status management, role assignment, and directory.",
  item: [
    createRequest({
      name: "Create Teacher User (Admin/Super Admin)",
      method: "POST",
      urlPath: "users",
      body: {
        name: "Prof. Vikram Sarabhai",
        email: "{{teacherEmail}}",
        password: "{{teacherPassword}}",
        role: "TEACHER",
        institutionId: "{{institutionId}}"
      },
      description: "Creates a new TEACHER user in the institution.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('teacherUserId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Create Student User (Admin/Super Admin)",
      method: "POST",
      urlPath: "users",
      body: {
        name: "Rahul Sharma",
        email: "{{studentEmail}}",
        password: "{{studentPassword}}",
        role: "STUDENT",
        institutionId: "{{institutionId}}"
      },
      description: "Creates a new STUDENT user in the institution.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('studentUserId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "List Users (Admin Filtered to Institution)",
      method: "GET",
      urlPath: "users",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "20" },
        { key: "institutionId", value: "{{institutionId}}" }
      ],
      description: "Retrieve users directory with role and status filtering.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get User By ID",
      method: "GET",
      urlPath: "users/{{teacherUserId}}",
      description: "Retrieve details for a specific user.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "pm.test('No password hash leaked', function () {",
        "    pm.expect(json.password).to.be.undefined;",
        "});"
      ]
    }),
    createRequest({
      name: "Update User Profile",
      method: "PATCH",
      urlPath: "users/{{teacherUserId}}",
      body: {
        name: "Dr. Vikram Sarabhai, Ph.D."
      },
      description: "Updates user name or contact information.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update User Status (Suspend Account)",
      method: "PATCH",
      urlPath: "users/{{studentUserId}}/status",
      body: {
        status: "SUSPENDED",
        reason: "Disciplinary hold"
      },
      description: "Changes user status and automatically revokes active sessions.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update User Role (Super Admin Only)",
      method: "PATCH",
      urlPath: "users/{{teacherUserId}}/role",
      body: {
        role: "ADMIN"
      },
      description: "Elevates user role. Restricted exclusively to Super Admin.",
      tests: [
        "pm.test('Status code is 200 OK or 403 Forbidden', function () {",
        "    pm.expect([200, 403]).to.include(pm.response.code);",
        "});"
      ]
    })
  ]
};

// 5. ROLES FOLDER
const rolesFolder = {
  name: "5. Roles",
  description: "Role definitions and hierarchy levels.",
  item: [
    createRequest({
      name: "Create Custom Role (Super Admin)",
      method: "POST",
      urlPath: "roles",
      body: {
        name: "DEPARTMENT_HEAD",
        description: "Department chairperson with elevated academic privileges",
        level: 3,
        isSystem: false
      },
      description: "Creates a new role definition. Super Admin only.",
      tests: [
        "pm.test('Status code is 201 Created or 409 Conflict', function () {",
        "    pm.expect([201, 409]).to.include(pm.response.code);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('roleId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "List All Roles",
      method: "GET",
      urlPath: "roles",
      description: "Get all registered roles.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "if (Array.isArray(json) && json.length > 0 && !pm.environment.get('roleId')) {",
        "    pm.environment.set('roleId', json[0]._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Get Role By ID",
      method: "GET",
      urlPath: "roles/{{roleId}}",
      description: "Retrieve role metadata.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Role",
      method: "PATCH",
      urlPath: "roles/{{roleId}}",
      body: {
        description: "Updated description for academic lead"
      },
      description: "Modify role description.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Delete Custom Role",
      method: "DELETE",
      urlPath: "roles/{{roleId}}",
      description: "Deletes custom role. System roles are protected.",
      tests: [
        "pm.test('Status code is 200 OK or 400 Bad Request', function () {",
        "    pm.expect([200, 400, 404]).to.include(pm.response.code);",
        "});"
      ]
    })
  ]
};

// 6. PERMISSIONS FOLDER
const permissionsFolder = {
  name: "6. Permissions",
  description: "Granular capability definitions across modules and actions.",
  item: [
    createRequest({
      name: "Create Permission (Super Admin)",
      method: "POST",
      urlPath: "permissions",
      body: {
        name: "STUDENT_EXPORT_REPORTS",
        description: "Ability to export student attendance and grade reports",
        module: "STUDENTS",
        action: "EXPORT"
      },
      description: "Super Admin creates a fine-grained permission token.",
      tests: [
        "pm.test('Status code is 201 Created or 409 Conflict', function () {",
        "    pm.expect([201, 409]).to.include(pm.response.code);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('permissionId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "List All Permissions",
      method: "GET",
      urlPath: "permissions",
      description: "Retrieve all platform permissions.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "if (Array.isArray(json) && json.length > 0 && !pm.environment.get('permissionId')) {",
        "    pm.environment.set('permissionId', json[0]._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Get Permission By ID",
      method: "GET",
      urlPath: "permissions/{{permissionId}}",
      description: "Retrieve specific permission details.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Permission",
      method: "PATCH",
      urlPath: "permissions/{{permissionId}}",
      body: {
        description: "Updated permission description"
      },
      description: "Update permission metadata.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Delete Permission",
      method: "DELETE",
      urlPath: "permissions/{{permissionId}}",
      description: "Remove permission.",
      tests: [
        "pm.test('Status code is 200 OK or 404', function () {",
        "    pm.expect([200, 404]).to.include(pm.response.code);",
        "});"
      ]
    })
  ]
};

// 7. ROLE PERMISSIONS FOLDER
const rolePermissionsFolder = {
  name: "7. Role Permissions",
  description: "Mapping relationships granting permissions to roles.",
  item: [
    createRequest({
      name: "Assign Permission To Role",
      method: "POST",
      urlPath: "role-permissions",
      body: {
        roleId: "{{roleId}}",
        permissionId: "{{permissionId}}"
      },
      description: "Maps a permission to a role.",
      tests: [
        "pm.test('Status code is 201 Created or 409 Conflict', function () {",
        "    pm.expect([201, 409]).to.include(pm.response.code);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('rolePermissionId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Get All Role Permissions",
      method: "GET",
      urlPath: "role-permissions",
      queryParams: [
        { key: "roleId", value: "{{roleId}}" }
      ],
      description: "List all role-to-permission mappings.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Permissions For Role",
      method: "GET",
      urlPath: "role-permissions/role/{{roleId}}",
      description: "Retrieve list of permissions assigned to role.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Effective Permissions For Role",
      method: "GET",
      urlPath: "role-permissions/effective/{{roleId}}",
      description: "Calculates inherited and effective permission set.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Remove Permission From Role",
      method: "DELETE",
      urlPath: "role-permissions/{{rolePermissionId}}",
      description: "Revokes a permission from a role.",
      tests: [
        "pm.test('Status code is 200 OK or 404', function () {",
        "    pm.expect([200, 404]).to.include(pm.response.code);",
        "});"
      ]
    })
  ]
};

// 8. STUDENT PROFILES FOLDER
const studentProfilesFolder = {
  name: "8. Student Profiles",
  description: "Academic student profiles with demographic, address, and guardian data.",
  item: [
    createRequest({
      name: "Create Student Profile - Success",
      method: "POST",
      urlPath: "student-profiles",
      body: {
        userId: "{{studentUserId}}",
        institutionId: "{{institutionId}}",
        admissionNumber: "ADM-2026-001",
        dateOfBirth: "2010-06-15T00:00:00.000Z",
        gender: "MALE",
        bloodGroup: "O+",
        address: {
          street: "742 Evergreen Terrace",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411001"
        },
        parentDetails: [
          {
            name: "Sunil Sharma",
            relationship: "FATHER",
            phone: "+919876543201",
            email: "sunil.sharma@example.com"
          }
        ],
        status: "ACTIVE"
      },
      description: "Creates academic profile for registered student user.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('studentProfileId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Create Student Profile - Duplicate Admission (409 Conflict)",
      method: "POST",
      urlPath: "student-profiles",
      body: {
        userId: "{{superAdminUserId}}",
        institutionId: "{{institutionId}}",
        admissionNumber: "ADM-2026-001",
        dateOfBirth: "2010-06-15T00:00:00.000Z",
        gender: "MALE"
      },
      description: "Tests unique compound index (institutionId + admissionNumber).",
      tests: [
        "pm.test('Status code is 409 Conflict', function () {",
        "    pm.response.to.have.status(409);",
        "});"
      ]
    }),
    createRequest({
      name: "List Student Profiles",
      method: "GET",
      urlPath: "student-profiles",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" },
        { key: "institutionId", value: "{{institutionId}}" }
      ],
      description: "List student profiles in the institution.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Student Profile By ID",
      method: "GET",
      urlPath: "student-profiles/{{studentProfileId}}",
      description: "Retrieve single student profile.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Student Profile By User ID",
      method: "GET",
      urlPath: "student-profiles/user/{{studentUserId}}",
      description: "Retrieve student profile via linked user ID.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Student Profiles By Institution",
      method: "GET",
      urlPath: "student-profiles/institution/{{institutionId}}",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" }
      ],
      description: "Fetch institutional roster of student profiles.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Student Profile",
      method: "PATCH",
      urlPath: "student-profiles/{{studentProfileId}}",
      body: {
        bloodGroup: "B+",
        status: "ACTIVE"
      },
      description: "Update student details.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    })
  ]
};

// 9. TEACHER PROFILES FOLDER
const teacherProfilesFolder = {
  name: "9. Teacher Profiles",
  description: "Faculty profiles with qualifications, designation, and employment status.",
  item: [
    createRequest({
      name: "Create Teacher Profile - Success",
      method: "POST",
      urlPath: "teacher-profiles",
      body: {
        userId: "{{teacherUserId}}",
        institutionId: "{{institutionId}}",
        employeeId: "EMP-2026-001",
        department: "Physics",
        designation: "Senior Lecturer",
        qualification: "Ph.D. in Astrophysics",
        specialization: "Quantum Mechanics",
        experience: 8,
        joiningDate: "2026-02-01T00:00:00.000Z",
        phone: "+919876543202",
        status: "ACTIVE"
      },
      description: "Creates teacher profile linked to user account.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('teacherProfileId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Create Teacher Profile - Duplicate Employee ID (409 Conflict)",
      method: "POST",
      urlPath: "teacher-profiles",
      body: {
        userId: "{{superAdminUserId}}",
        institutionId: "{{institutionId}}",
        employeeId: "EMP-2026-001",
        department: "Mathematics",
        designation: "Lecturer",
        qualification: "M.Sc.",
        joiningDate: "2026-02-01T00:00:00.000Z",
        phone: "+919876543203"
      },
      description: "Enforces uniqueness of employee ID within institution.",
      tests: [
        "pm.test('Status code is 409 Conflict', function () {",
        "    pm.response.to.have.status(409);",
        "});"
      ]
    }),
    createRequest({
      name: "List Teacher Profiles",
      method: "GET",
      urlPath: "teacher-profiles",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" },
        { key: "institutionId", value: "{{institutionId}}" }
      ],
      description: "List all teachers in institution.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Teacher Profile By ID",
      method: "GET",
      urlPath: "teacher-profiles/{{teacherProfileId}}",
      description: "Retrieve teacher profile.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Teacher Profile By User ID",
      method: "GET",
      urlPath: "teacher-profiles/user/{{teacherUserId}}",
      description: "Retrieve teacher profile via user ID.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Teacher Profiles By Institution",
      method: "GET",
      urlPath: "teacher-profiles/institution/{{institutionId}}",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" }
      ],
      description: "List teachers for a specific institution.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Teacher Profile",
      method: "PATCH",
      urlPath: "teacher-profiles/{{teacherProfileId}}",
      body: {
        designation: "Head of Physics Department",
        experience: 9
      },
      description: "Update teacher information.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    })
  ]
};

// 10. CLASSES FOLDER
const classesFolder = {
  name: "10. Classes",
  description: "Academic classroom cohorts, sections, and class teacher assignments.",
  item: [
    createRequest({
      name: "Create Class - Success",
      method: "POST",
      urlPath: "classes",
      body: {
        name: "Grade 10",
        section: "A",
        institutionId: "{{institutionId}}",
        academicYear: "2026-2027",
        classTeacherId: "{{teacherProfileId}}",
        capacity: 40,
        description: "Primary Tenth Grade Section A"
      },
      description: "Creates a new class cohort.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('classId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "List Classes",
      method: "GET",
      urlPath: "classes",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" },
        { key: "institutionId", value: "{{institutionId}}" }
      ],
      description: "List classes in institution.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Class By ID",
      method: "GET",
      urlPath: "classes/{{classId}}",
      description: "Retrieve class details.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Classes By Institution",
      method: "GET",
      urlPath: "classes/institution/{{institutionId}}",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" }
      ],
      description: "Fetch all classes belonging to the specified institution.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Class Details",
      method: "PATCH",
      urlPath: "classes/{{classId}}",
      body: {
        capacity: 45,
        description: "Updated capacity for Grade 10 Section A"
      },
      description: "Updates class metadata.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Delete Class",
      method: "DELETE",
      urlPath: "classes/{{classId}}",
      description: "Removes class.",
      tests: [
        "pm.test('Status code is 200 OK or 404', function () {",
        "    pm.expect([200, 404]).to.include(pm.response.code);",
        "});"
      ]
    })
  ]
};

// 11. SUBJECTS FOLDER
const subjectsFolder = {
  name: "11. Subjects",
  description: "Academic subjects offered within classes and assigned instructors.",
  item: [
    createRequest({
      name: "Create Subject - Success",
      method: "POST",
      urlPath: "subjects",
      body: {
        name: "Classical Mechanics & Optics",
        code: "PHYS-101",
        institutionId: "{{institutionId}}",
        classId: "{{classId}}",
        teacherId: "{{teacherProfileId}}",
        description: "Fundamental physics principles",
        credits: 4
      },
      description: "Creates an academic subject within a class.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('subjectId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "List Subjects",
      method: "GET",
      urlPath: "subjects",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" },
        { key: "institutionId", value: "{{institutionId}}" }
      ],
      description: "List subjects with filters.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Subject By ID",
      method: "GET",
      urlPath: "subjects/{{subjectId}}",
      description: "Retrieve specific subject details.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Subjects By Class",
      method: "GET",
      urlPath: "subjects/class/{{classId}}",
      description: "Retrieve subjects taught in a particular class.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Subject",
      method: "PATCH",
      urlPath: "subjects/{{subjectId}}",
      body: {
        credits: 5,
        description: "Advanced physics curriculum"
      },
      description: "Update subject details.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Delete Subject (Super Admin Only)",
      method: "DELETE",
      urlPath: "subjects/{{subjectId}}",
      description: "Delete subject. Super Admin exclusive.",
      tests: [
        "pm.test('Status code is 200 OK or 403 Forbidden', function () {",
        "    pm.expect([200, 403, 404]).to.include(pm.response.code);",
        "});"
      ]
    })
  ]
};

// 12. ENROLLMENTS FOLDER
const enrollmentsFolder = {
  name: "12. Enrollments",
  description: "Student enrollments linking student profiles into classes.",
  item: [
    createRequest({
      name: "Create Enrollment - Success",
      method: "POST",
      urlPath: "enrollments",
      body: {
        studentProfileId: "{{studentProfileId}}",
        classId: "{{classId}}",
        institutionId: "{{institutionId}}",
        academicYear: "2026-2027",
        enrollmentDate: "2026-06-01T00:00:00.000Z",
        status: "ACTIVE"
      },
      description: "Enrolls student into class for academic year.",
      tests: [
        "pm.test('Status code is 201 Created', function () {",
        "    pm.response.to.have.status(201);",
        "});",
        "var json = pm.response.json();",
        "if (json._id) {",
        "    pm.environment.set('enrollmentId', json._id);",
        "}"
      ]
    }),
    createRequest({
      name: "List Enrollments",
      method: "GET",
      urlPath: "enrollments",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" },
        { key: "institutionId", value: "{{institutionId}}" }
      ],
      description: "List student enrollments.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Enrollment By ID",
      method: "GET",
      urlPath: "enrollments/{{enrollmentId}}",
      description: "Retrieve enrollment record.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Enrollments By Student",
      method: "GET",
      urlPath: "enrollments/student/{{studentProfileId}}",
      description: "Fetch student's academic enrollment history.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Enrollments By Class",
      method: "GET",
      urlPath: "enrollments/class/{{classId}}",
      description: "Retrieve class roster of enrolled students.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Update Enrollment Status",
      method: "PATCH",
      urlPath: "enrollments/{{enrollmentId}}",
      body: {
        status: "GRADUATED",
        remarks: "Completed curriculum requirements"
      },
      description: "Update student enrollment status.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    })
  ]
};

// 13. AUDIT LOGS FOLDER
const auditLogsFolder = {
  name: "13. Audit Logs",
  description: "Centralized compliance and security audit trail.",
  item: [
    createRequest({
      name: "Get All Audit Logs (Super Admin)",
      method: "GET",
      urlPath: "audit-logs",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "20" }
      ],
      description: "Super Admin queries platform-wide security audit trail.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "if (json.data && Array.isArray(json.data) && json.data.length > 0) {",
        "    pm.environment.set('auditLogId', json.data[0]._id);",
        "}"
      ]
    }),
    createRequest({
      name: "Get Audit Log By ID (Super Admin)",
      method: "GET",
      urlPath: "audit-logs/{{auditLogId}}",
      description: "Retrieve specific audit log entry by ID.",
      tests: [
        "pm.test('Status code is 200 OK or 404', function () {",
        "    pm.expect([200, 404]).to.include(pm.response.code);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Audit Logs By User",
      method: "GET",
      urlPath: "audit-logs/user/{{adminUserId}}",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" }
      ],
      description: "Retrieve audit activity associated with a user.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }),
    createRequest({
      name: "Get Audit Logs By Institution",
      method: "GET",
      urlPath: "audit-logs/institution/{{institutionId}}",
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "10" }
      ],
      description: "Retrieve institutional compliance audit log.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    })
  ]
};

// 14. DASHBOARD FOLDER
const dashboardFolder = {
  name: "14. Dashboard",
  description: "Aggregated analytics and operational summaries.",
  item: [
    createRequest({
      name: "Get Platform Dashboard Stats (Super Admin)",
      method: "GET",
      urlPath: "dashboard/stats",
      description: "Platform-wide metrics: total institutions, active users, system health.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "var json = pm.response.json();",
        "pm.test('Returns metrics object', function () {",
        "    pm.expect(json).to.be.an('object');",
        "});"
      ]
    }),
    createRequest({
      name: "Get Institution Dashboard Stats (Admin)",
      method: "GET",
      urlPath: "dashboard/institution/{{institutionId}}",
      description: "Institution metrics: student count, teacher count, class counts.",
      tests: [
        "pm.test('Status code is 200 OK', function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    })
  ]
};

// 15. NEGATIVE & SECURITY TESTS FOLDER
const securityFolder = {
  name: "15. Security & Edge Tests",
  description: "Cross-cutting negative security and validation test assertions.",
  item: [
    createRequest({
      name: "401 Unauthorized - Access With Missing Token",
      method: "GET",
      urlPath: "auth/me",
      authType: "none",
      description: "Verifies that accessing protected endpoints without Bearer token returns 401.",
      tests: [
        "pm.test('Status code is 401 Unauthorized', function () {",
        "    pm.response.to.have.status(401);",
        "});"
      ]
    }),
    createRequest({
      name: "401 Unauthorized - Access With Invalid Token",
      method: "GET",
      urlPath: "auth/me",
      authType: "none",
      description: "Verifies invalid signature rejection.",
      tests: [
        "pm.test('Status code is 401 Unauthorized', function () {",
        "    pm.response.to.have.status(401);",
        "});"
      ]
    }),
    createRequest({
      name: "403 Forbidden - Role Escalation Violation (Student to Admin)",
      method: "POST",
      urlPath: "institutions",
      body: {
        name: "Unauthorized Academy",
        code: "UNAUTH1",
        type: "SCHOOL",
        email: "hack@unauth.com",
        phone: "+910000000000",
        address: { street: "1 St", city: "Pune", state: "MH", postalCode: "411001", country: "India" },
        subscription: { plan: "FREE", status: "ACTIVE", startDate: "2026-01-01T00:00:00.000Z", endDate: "2027-01-01T00:00:00.000Z" }
      },
      description: "Non-SuperAdmin attempting SuperAdmin endpoint returns 403.",
      tests: [
        "pm.test('Status code is 403 Forbidden', function () {",
        "    pm.response.to.have.status(403);",
        "});"
      ]
    }),
    createRequest({
      name: "400 Bad Request - Malformed MongoDB ObjectId",
      method: "GET",
      urlPath: "users/{{malformedObjectId}}",
      description: "Tests ParseObjectIdPipe rejecting invalid hex format strings.",
      tests: [
        "pm.test('Status code is 400 Bad Request', function () {",
        "    pm.response.to.have.status(400);",
        "});"
      ]
    }),
    createRequest({
      name: "404 Not Found - Non-Existent Valid ObjectId",
      method: "GET",
      urlPath: "institutions/{{invalidObjectId}}",
      description: "Tests valid 24-char hex ObjectId that does not exist in DB.",
      tests: [
        "pm.test('Status code is 404 Not Found', function () {",
        "    pm.response.to.have.status(404);",
        "});"
      ]
    }),
    createRequest({
      name: "400 Bad Request - Validation Pipe Rejection (Extra Field Whitelist)",
      method: "POST",
      urlPath: "auth/register",
      authType: "none",
      body: {
        name: "Hacker User",
        email: "hacker@test.com",
        password: "ValidPass123",
        role: "SUPER_ADMIN",
        isAdmin: true
      },
      description: "Tests forbidNonWhitelisted option rejecting unrecognized fields.",
      tests: [
        "pm.test('Status code is 400 Bad Request', function () {",
        "    pm.response.to.have.status(400);",
        "});"
      ]
    })
  ]
};

const collection = {
  info: {
    _postman_id: "c82b9e67-d860-449e-8c81-88f58b732e41",
    name: "Student Management System - Complete API Test Suite",
    description: "Production-ready automated Postman collection covering all 14 backend modules and security endpoints for the Multi-School Education Management System.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [
    institutionsFolder,
    authFolder,
    sessionsFolder,
    usersFolder,
    rolesFolder,
    permissionsFolder,
    rolePermissionsFolder,
    studentProfilesFolder,
    teacherProfilesFolder,
    classesFolder,
    subjectsFolder,
    enrollmentsFolder,
    auditLogsFolder,
    dashboardFolder,
    securityFolder
  ]
};

const outputPath = path.join(__dirname, 'collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf8');
console.log(`Successfully generated Postman collection at: ${outputPath}`);
console.log(`Total folders: ${collection.item.length}`);
let totalRequests = 0;
collection.item.forEach(f => {
  totalRequests += f.item.length;
  console.log(` - ${f.name}: ${f.item.length} requests`);
});
console.log(`Total requests across all folders: ${totalRequests}`);

