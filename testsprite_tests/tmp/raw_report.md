
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** SIGAPPA
- **Date:** 2026-06-13
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Login as a registered lecturer with NIP verification
- **Test Code:** [TC001_Login_as_a_registered_lecturer_with_NIP_verification.py](./TC001_Login_as_a_registered_lecturer_with_NIP_verification.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the localhost application did not respond, preventing access to the Lecturer Login flow.

Observations:
- The browser shows "ERR_EMPTY_RESPONSE" with the message "localhost didn’t send any data."
- The page only displays a "Reload" button and no login fields (NIP, Verify button, password, or Submit) are present
- Multiple attempts were made (navigations to / and /login/dosen plus three reload clicks) and the site remained unavailable

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/3335db16-cffe-415e-9839-31397bf3e349
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Access control blocks unauthenticated users from protected pages
- **Test Code:** [TC002_Access_control_blocks_unauthenticated_users_from_protected_pages.py](./TC002_Access_control_blocks_unauthenticated_users_from_protected_pages.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the web application did not respond, so protected pages could not be reached to verify a login gate.

Observations:
- The browser displayed "ERR_EMPTY_RESPONSE" for 127.0.0.1:8000 and the page showed the standard browser error page.
- Clicking the Reload button did not restore the connection; the error page remained.
- Previous attempts to navigate to /cek-status and /pengajuan returned empty responses (ERR_EMPTY_RESPONSE), so the login gate could not be observed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/197b3d4f-aa11-4c3f-aa7b-4b8ffa738d4a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Submit a new PKM proposal successfully
- **Test Code:** [TC003_Submit_a_new_PKM_proposal_successfully.py](./TC003_Submit_a_new_PKM_proposal_successfully.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the application server did not respond, preventing access to the login form and subsequent proposal functionality.

Observations:
- The browser shows an error page with 'ERR_EMPTY_RESPONSE' and the message 'localhost didn’t send any data.'
- Navigation to '/' and '/login' both resulted in the same empty response error.
- The 'Reload' button was clicked twice and the page remained on the error screen; no login form or application UI was observed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/66abdd64-5471-49cb-a479-9f820f8e3331
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Open the public welcome page
- **Test Code:** [TC004_Open_the_public_welcome_page.py](./TC004_Open_the_public_welcome_page.py)
- **Test Error:** TEST BLOCKED

The SIGAPPA public entry page could not be reached — the server returned an empty response and the application did not render the welcome or authentication options.

Observations:
- The browser shows 'ERR_EMPTY_RESPONSE' and the page displays a 'Reload' button.
- Multiple reload attempts (4) did not load the welcome page or any public/access authentication options.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/7f281591-7aa6-457e-a512-1d37c79f5ade
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Log in with existing standard credentials
- **Test Code:** [TC005_Log_in_with_existing_standard_credentials.py](./TC005_Log_in_with_existing_standard_credentials.py)
- **Test Error:** TEST BLOCKED

The application's login page could not be reached — the server returned no response and the SPA did not render, so the login flow cannot be tested.

Observations:
- The page displays an empty SPA / ERR_EMPTY_RESPONSE with a 'Reload' button but no login form.
- Both http://localhost:8000/login and http://127.0.0.1:8000/login returned ERR_EMPTY_RESPONSE when reloaded.
- No email/password fields or 'Login' button were visible in any tab.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/5f904f97-ef31-46ea-86c3-ad28965019c2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Register a new lecturer after NIP verification
- **Test Code:** [TC006_Register_a_new_lecturer_after_NIP_verification.py](./TC006_Register_a_new_lecturer_after_NIP_verification.py)
- **Test Error:** TEST BLOCKED

The Lecturer login page could not be reached — the server returned an empty response and the UI stayed on the browser error page.

Observations:
- The browser displays "This page isn’t working" with message "localhost didn’t send any data." and error code ERR_EMPTY_RESPONSE.
- The page shows a visible "Reload" button; clicking it twice did not restore the site and the error page persisted.
- No login or registration form was reachable, so the NIP verification and registration flow could not be executed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/8c71567d-8139-4d69-9194-44fb5dc09fe8
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create a standard user account
- **Test Code:** [TC007_Create_a_standard_user_account.py](./TC007_Create_a_standard_user_account.py)
- **Test Error:** TEST BLOCKED

The registration page could not be reached — the server returned no data and the registration UI did not load, so the registration flow could not be executed.

Observations:
- The page displays the browser error message 'ERR_EMPTY_RESPONSE' for http://localhost:8000/register.
- The only interactive element visible is a 'Reload' button, and clicking it was attempted multiple times but did not load the application UI.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/d384dc22-ae8e-4eb9-8fdf-09d5d1d0c5fa
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 View the public PKM map dashboard
- **Test Code:** [TC008_View_the_public_PKM_map_dashboard.py](./TC008_View_the_public_PKM_map_dashboard.py)
- **Test Error:** TEST BLOCKED

The public dashboard could not be reached — the /beranda page returned a blank viewport and no UI elements, so verification cannot proceed.

Observations:
- Navigated to /beranda and the page displayed a blank white viewport with 0 interactive elements.
- No map, markers, dashboard headings, or activity info were present on the page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/1dc5e4ad-1102-4161-a844-a26ce0c4f315
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Review linked PKM proposals in status tracking
- **Test Code:** [TC009_Review_linked_PKM_proposals_in_status_tracking.py](./TC009_Review_linked_PKM_proposals_in_status_tracking.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the frontend application and agent backend are not reachable, so the agent run and streaming verification cannot be executed.

Observations:
- The browser shows an error page with 'ERR_EMPTY_RESPONSE' and a visible 'Reload' button; the SPA UI (composer, Agent button, Send button) is not present.
- The application terminal previously reported 'agent sidecar offline', indicating the backend agent service is unreachable.
- Multiple reload attempts returned no content and did not restore the workspace UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/402dce97-91af-42b5-9d2d-072eb38a51ed
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Review the list of submitted PKM proposals
- **Test Code:** [TC010_Review_the_list_of_submitted_PKM_proposals.py](./TC010_Review_the_list_of_submitted_PKM_proposals.py)
- **Test Error:** TEST BLOCKED

The admin submissions page could not be reached — the local web server did not respond, so the UI could not be tested.

Observations:
- The browser displays "This page isn’t working" and the error code ERR_EMPTY_RESPONSE.
- The message on the page states "localhost didn’t send any data." and a single "Reload" button is present.
- Reload was clicked three times and direct navigation to /admin/pengajuan was attempted; none of these actions caused the application UI to load.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/4eb2cb35-4a1d-4ca6-9f6a-0f27ca2f8716
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Track proposal status and team correlation
- **Test Code:** [TC011_Track_proposal_status_and_team_correlation.py](./TC011_Track_proposal_status_and_team_correlation.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the Login page could not be reached because the application returned an empty response.

Observations:
- The browser displayed 'ERR_EMPTY_RESPONSE' and the page message 'localhost didn't send any data.'
- The only actionable control was a visible 'Reload' button; clicking it multiple times did not load the application.
- The login form could not be reached, so the login and subsequent status/team-correlation checks could not be executed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/9a962a52-8a02-4c12-ba4c-9166e524bef6
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Add a new user account
- **Test Code:** [TC012_Add_a_new_user_account.py](./TC012_Add_a_new_user_account.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the web application is unreachable and the login/user-management pages cannot be loaded.

Observations:
- The browser shows a "This page isn't working" message for localhost with ERR_EMPTY_RESPONSE.
- The only interactive element available is a 'Reload' button which was clicked multiple times and did not restore the application.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/61b9c1c2-3be5-4439-a05e-13b3a7389d7b
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Review PKM submissions in the admin list
- **Test Code:** [TC013_Review_PKM_submissions_in_the_admin_list.py](./TC013_Review_PKM_submissions_in_the_admin_list.py)
- **Test Error:** TEST BLOCKED

The login page could not be reached — the application server is not responding at /login.

Observations:
- The browser shows 'ERR_EMPTY_RESPONSE' and the message 'localhost didn’t send any data.'
- The page only displays a 'Reload' button and repeated reload attempts did not load the login form or any application UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/afa1a3e7-27c3-4c01-bea2-fcf753fe4a5d
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Open the admin dashboard and review summary metrics
- **Test Code:** [TC014_Open_the_admin_dashboard_and_review_summary_metrics.py](./TC014_Open_the_admin_dashboard_and_review_summary_metrics.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the UI is not reachable and the login page did not load.

Observations:
- Navigating to http://localhost:8000 and http://127.0.0.1:8000/login returned a blank page with no interactive elements.
- The screenshot shows an empty white viewport; the SPA did not render and no login form is present.

Next steps to unblock:
- Ensure the SIGAPPA backend and frontend are started and listening on port 8000.
- Verify that http://127.0.0.1:8000/login loads a login form (email/username, password, and a submit button).
- After confirming the app is running, re-run this test to perform the login and dashboard verification.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/f6906346-2432-4cd3-a91a-d05da38ad6ec
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 View the admin submission dashboard
- **Test Code:** [TC015_View_the_admin_submission_dashboard.py](./TC015_View_the_admin_submission_dashboard.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the UI could not be reached; the login page failed to load and the app could not be interacted with.

Observations:
- The browser shows 'ERR_EMPTY_RESPONSE' and reports that localhost didn't send any data.
- The page displays only a 'Reload' button; the login form and any admin UI never appeared.
- The 'Reload' button was clicked 3 times with no change in page state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6f8c3c68-d46c-44f9-9417-21afbe4a1d89/7be77781-55bb-4938-8346-db057fb8d4b3
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---