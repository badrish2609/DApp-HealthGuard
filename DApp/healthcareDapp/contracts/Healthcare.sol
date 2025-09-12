// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Healthcare {
    struct Patient {
        string id;
        string name;
        string disease;
        string dob;
        string mobile;
        string email;
        string sbp;
        string sugar;
        string password;
    }

    struct Doctor {
        string doctorId;
        string name;
        string phone;
        string password;
    }

    struct ChatMessage {
        uint256 id;
        string senderId;
        string senderName;
        string senderType; // "patient" or "doctor"
        string message;
        string encryptedMessage;
        uint256 timestamp;
        bool isAppointmentInfo;
        string appointmentData; // JSON string for appointment data
    }

    struct Appointment {
        uint256 id;
        string patientId;
        string patientName;
        string doctorId;
        string doctorName;
        string date;
        string time;
        string reason;
        string status;
        uint256 createdAt;
        bool fromRequest;
    }

    mapping(string => Patient) public patients;
    mapping(string => Doctor) public doctors;
    mapping(string => ChatMessage[]) public chatHistory; // chatKey => messages[]
    mapping(uint256 => Appointment) public appointments;

    string[] public patientIds;
    string[] public doctorIds;
    uint256[] public appointmentIds;

    uint public patientCount = 0;
    uint public doctorCount = 0;
    uint256 public appointmentCount = 0;
    uint256 public messageCount = 0;

    event PatientRegistered(string patientId, string name);
    event DoctorRegistered(string doctorId, string name);
    event MessageSent(string chatKey, string senderId, string senderType, uint256 timestamp);
    event AppointmentCreated(uint256 appointmentId, string patientId, string doctorId, string date);

    // Helper to pad numbers to 3 digits (e.g., 1 -> 001)
    function pad(uint num) private pure returns (string memory) {
        if (num < 10) return string(abi.encodePacked("00", uint2str(num)));
        if (num < 100) return string(abi.encodePacked("0", uint2str(num)));
        return uint2str(num);
    }

    function uint2str(uint _i) private pure returns (string memory str) {
        if (_i == 0) return "0";
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        str = string(bstr);
    }

    // Register a patient (auto-generate ID)
    function registerPatient(
        string memory _name,
        string memory _disease,
        string memory _dob,
        string memory _mobile,
        string memory _email,
        string memory _sbp,
        string memory _sugar,
        string memory _password
    ) public returns (string memory) {
        patientCount++;
        string memory newId = string(abi.encodePacked("P", pad(patientCount)));
        require(bytes(patients[newId].id).length == 0, "Patient already registered");
        patients[newId] = Patient(newId, _name, _disease, _dob, _mobile, _email, _sbp, _sugar, _password);
        patientIds.push(newId);
        emit PatientRegistered(newId, _name);
        return newId;
    }

    // Register a doctor (frontend supplies regId)
    function registerDoctor(
        string memory _name,
        string memory _regId,
        string memory _phone,
        string memory _password
    ) public returns (string memory) {
        require(bytes(doctors[_regId].doctorId).length == 0, "Doctor already registered");
        doctors[_regId] = Doctor(_regId, _name, _phone, _password);
        doctorIds.push(_regId);
        doctorCount++; // Increment doctor count
        emit DoctorRegistered(_regId, _name);
        return _regId;
    }

    // Patient login
    function loginPatient(string memory _patientId, string memory _password) public view returns (bool) {
        return (keccak256(bytes(patients[_patientId].password)) == keccak256(bytes(_password)));
    }

    // Doctor login
    function loginDoctor(string memory _regId, string memory _password) public view returns (bool) {
        return (keccak256(bytes(doctors[_regId].password)) == keccak256(bytes(_password)));
    }

    // Get a patient by ID (for login/dashboard)
    function getPatientById(string memory _patientId) public view returns (
        string memory id,
        string memory name,
        string memory disease,
        string memory dob,
        string memory mobile,
        string memory email,
        string memory sbp,
        string memory sugar
    ) {
        Patient memory p = patients[_patientId];
        return (p.id, p.name, p.disease, p.dob, p.mobile, p.email, p.sbp, p.sugar);
    }

    // Get doctor info by regId
    function getDoctorByRegId(string memory _regId) public view returns (
        string memory name,
        string memory regId,
        string memory phone
    ) {
        Doctor memory d = doctors[_regId];
        return (d.name, d.doctorId, d.phone);
    }

    // Chat functionality
    function sendChatMessage(
        string memory _patientId,
        string memory _doctorId,
        string memory _senderId,
        string memory _senderName,
        string memory _senderType,
        string memory _message,
        string memory _encryptedMessage,
        bool _isAppointmentInfo,
        string memory _appointmentData
    ) public returns (uint256) {
        messageCount++;
        string memory chatKey = string(abi.encodePacked(_patientId, "_", _doctorId));
        
        ChatMessage memory newMessage = ChatMessage({
            id: messageCount,
            senderId: _senderId,
            senderName: _senderName,
            senderType: _senderType,
            message: _message,
            encryptedMessage: _encryptedMessage,
            timestamp: block.timestamp,
            isAppointmentInfo: _isAppointmentInfo,
            appointmentData: _appointmentData
        });
        
        chatHistory[chatKey].push(newMessage);
        
        emit MessageSent(chatKey, _senderId, _senderType, block.timestamp);
        return messageCount;
    }

    // Get chat messages between patient and doctor
    function getChatMessages(string memory _patientId, string memory _doctorId) 
        public view returns (ChatMessage[] memory) {
        string memory chatKey = string(abi.encodePacked(_patientId, "_", _doctorId));
        return chatHistory[chatKey];
    }

    // Get number of messages in a chat
    function getChatMessageCount(string memory _patientId, string memory _doctorId) 
        public view returns (uint256) {
        string memory chatKey = string(abi.encodePacked(_patientId, "_", _doctorId));
        return chatHistory[chatKey].length;
    }

    // Store appointment on blockchain
    function createAppointment(
        string memory _patientId,
        string memory _patientName,
        string memory _doctorId,
        string memory _doctorName,
        string memory _date,
        string memory _time,
        string memory _reason,
        string memory _status,
        bool _fromRequest
    ) public returns (uint256) {
        appointmentCount++;
        
        Appointment memory newAppointment = Appointment({
            id: appointmentCount,
            patientId: _patientId,
            patientName: _patientName,
            doctorId: _doctorId,
            doctorName: _doctorName,
            date: _date,
            time: _time,
            reason: _reason,
            status: _status,
            createdAt: block.timestamp,
            fromRequest: _fromRequest
        });
        
        appointments[appointmentCount] = newAppointment;
        appointmentIds.push(appointmentCount);
        
        emit AppointmentCreated(appointmentCount, _patientId, _doctorId, _date);
        return appointmentCount;
    }

    // Get appointments for a patient
    function getPatientAppointments(string memory _patientId) 
        public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](appointmentCount);
        uint256 counter = 0;
        
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (keccak256(bytes(appointments[i].patientId)) == keccak256(bytes(_patientId))) {
                result[counter] = i;
                counter++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory patientAppointments = new uint256[](counter);
        for (uint256 i = 0; i < counter; i++) {
            patientAppointments[i] = result[i];
        }
        
        return patientAppointments;
    }

    // Get appointments for a doctor
    function getDoctorAppointments(string memory _doctorId) 
        public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](appointmentCount);
        uint256 counter = 0;
        
        for (uint256 i = 1; i <= appointmentCount; i++) {
            if (keccak256(bytes(appointments[i].doctorId)) == keccak256(bytes(_doctorId))) {
                result[counter] = i;
                counter++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory doctorAppointments = new uint256[](counter);
        for (uint256 i = 0; i < counter; i++) {
            doctorAppointments[i] = result[i];
        }
        
        return doctorAppointments;
    }

    // Get appointment by ID
    function getAppointmentById(uint256 _appointmentId) public view returns (
        uint256 id,
        string memory patientId,
        string memory patientName,
        string memory doctorId,
        string memory doctorName,
        string memory date,
        string memory time,
        string memory reason,
        string memory status,
        uint256 createdAt,
        bool fromRequest
    ) {
        Appointment memory apt = appointments[_appointmentId];
        return (
            apt.id,
            apt.patientId,
            apt.patientName,
            apt.doctorId,
            apt.doctorName,
            apt.date,
            apt.time,
            apt.reason,
            apt.status,
            apt.createdAt,
            apt.fromRequest
        );
    }
}