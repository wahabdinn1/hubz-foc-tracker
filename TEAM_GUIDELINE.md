# Team Guidelines & SOP Hubz FOC

This document is the official guide for the operations team when using the **Hubz FOC (Free of Charge) Inventory Tracker**. This system is designed to monitor, record, and manage the flow of FOC devices quickly, accurately, and centrally.

---

## 1. Introduction
**Purpose of the FOC Tracker:**
The Hubz FOC Inventory Tracker system is built specifically to simplify the asset management of devices loaned or given to Key Opinion Leaders (KOLs) or for other campaign needs.
With this system, the team can accurately track:
- Who is currently holding a specific unit / device.
- The status of each device (Available, On Loan, Lost, etc.).
- The history of item movements (Audit Log).

---

## 2. Dashboard & Inventory Bank
The system provides two central monitoring pages for the operations team:

**A. Dashboard**
The main page that presents a summary of inventory data in *real-time*.
- **Device Status:** Displays the overall allocation of units that are `AVAILABLE` (Available in locker/warehouse) and those that are `ON LOANED` (Currently loaned out/in use by KOLs).
- **Return Tracking:** Monitors which units must be returned soon or have already passed their deadline (Overdue).
- **Recent Activities:** Displays the latest item movement log, such as new *Requests*, *Returns*, or *Transfers*.

**B. Inventory Bank (/inventory)**
The main asset database page (Master List) for all FOC devices.
- **Global Search:** Allows you to search for specific IMEIs/Serial Numbers to find out their location, status, and latest holder history.
- **Data Filtering:** You can filter units by Model/Category to see the detailed availability of each device type.
- **Physical Data Validation:** Used as the most accurate reference when performing *stock opname* or matching physical locker items with system data.

---

## 3. Outbound / Request Process
This process is used when a device will be sent out to a KOL or third party.

**Outbound (Request) Steps:**
1. Open the **New Request** form.
2. **Select Category (Step 1):** Select the device category first (e.g., Mobile Phone, Tablet, etc.).
3. **Select Unit/IMEI (Step 2):** Once the category is selected, the system will only show units with an **`AVAILABLE`** status in the *dropdown*. You cannot select units that are currently borrowed (currently *On Loaned*).
4. Fill in Campaign data, KOL name, Delivery Destination, etc.
5. The system will automatically fill in the **Type of FOC** field based on the master data of the selected IMEI.
6. Click **Submit Request**. Data will immediately sync with Google Sheets.

> **Important Note:** Only units with an **AVAILABLE** status can be checked out. If a unit does not appear, ensure that the unit has been marked as returned (*Return*) in the system.

---

## 4. Inbound / Return Process
This process is carried out when a device is returned by a KOL to Hubz / Locker.

**Inbound (Return) Steps:**
1. On the table or KOL details, select the **Return** option for the unit currently being borrowed.
2. Ensure you match the physical IMEI and box with the IMEI in the system.
3. Update the device condition upon return (Good, Cracked Screen, Lost, etc.).
4. Once submitted, the unit's status will automatically revert to **AVAILABLE** in the inventory bank.

---

## 5. Transfer Between KOL (Direct Transfer)
This feature is used when a device changes hands from one KOL to another KOL directly without needing to be returned (*Return*) to the warehouse first.

**Direct Transfer Flow:**
1. Use the **Transfer** button/form on a unit that is currently borrowed (*On Loaned*).
2. The system will automatically detect and **fill in the "Current Holder" field** based on the KOL currently holding the unit.
3. You just need to fill in the **New Receiver (New KOL)** along with their campaign and delivery details.
4. Click Submit. The form will perform a double entry (*Double Append*) in the database to keep the history neat: it records that the item was returned by the old KOL, and instantly loaned out to the new KOL.

---

## 6. Troubleshooting & FAQ
Here are some common issues that may occur:

- **Unit does not appear in the dropdown during Request:**
  *Cause:* The item's status is not yet `AVAILABLE` or is already borrowed by someone else.
  *Solution:* Check the item's location in the Inventory Bank menu. If the item was just returned, make sure the Inbound (Return) process has been completed.
  
- **"Conflict / Unit Unavailable" Error appears when Submitting Request:**
  *Cause:* Another team member has just requested the same unit at the exact same exact second/minute (Race Condition).
  *Solution:* The system will reset your *dropdown*. Please select another available unit/IMEI.

- **System data differs from physical (locker) data:**
  *Solution:* Cross-check the Audit Log to see who processed that device last. Always ensure status updates are input in real-time.

---

_These guidelines are created to ensure inventory data integrity is always maintained. Please adhere to the steps above during operations._
