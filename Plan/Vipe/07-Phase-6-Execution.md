# Phase 6 Execution Plan: Advanced Operations

## Overview
Phase 6 focuses exclusively on Visitor Access and Ticketing. With the core foundation (People, Memberships, Staff, Sports, and CMS) complete, this phase introduces the ability to handle non-member visitors.

## Core Objectives
1. **Visitor Access & Ticketing**: Allow non-members to purchase day passes or event tickets, tracking visitor data permanently as required by the Master Instructions.

## Step-by-Step Execution

### Phase 6A: Visitor Access & Ticketing
1. **Schema (`20260504031_visitor_access.sql`)**:
   - `tickets` (ticket_number, person_id, valid_date, price, status)
   - `gate_logs` (person_id, ticket_id, gate_id, scan_time, direction)
2. **Dashboard**:
   - Create Visitor Ticketing Interface (`/system/visitors/tickets`) to issue day passes and link them to `people` records (enforcing the phone number rule).
