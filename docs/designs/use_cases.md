# n8n-nodes-kroki Use Cases

This document defines the specific use cases implemented in the n8n-nodes-kroki project. Each use case represents a specific diagram conversion functionality that can be executed within n8n workflows using the Kroki service.

**project directories**
- nodes/Kroki/ - Kroki diagram conversion node implementation with 22+ supported diagram types
- n8n_test_env/ - Docker-based testing environment for local n8n integration testing
- docs/designs/ - Architecture and use case documentation for the Kroki integration

The n8n-nodes-kroki project provides comprehensive diagram conversion functionality through the Kroki service, supporting over 20 diagram types (Mermaid, PlantUML, GraphViz, D2, DBML, etc.) with multiple output formats (PNG, SVG, PDF). The node integrates with both public Kroki service and custom server deployments, providing flexible binary data output for workflow automation.

## USE-CASE: Diagram Source to Image Conversion

**Feature 1: Multi-format Diagram Conversion with Kroki API Integration**

|| definition |
|--|--|
| GIVEN | A workflow with diagram source code text and user-configured diagram type and output format |
| WHEN | The Kroki node executes with the specified parameters and makes an HTTP request to Kroki service |
| THEN | The diagram source is converted to the specified format (PNG/SVG/PDF) and returned as n8n binary data |

**State Diagram: Logic flow within feature**

The state diagram shows the progression from parameter validation through API request to binary data conversion, including error handling states.

```mermaid
---
title: Kroki Diagram Conversion State Flow
---
stateDiagram-v2
    [*] --> ParameterExtraction
    ParameterExtraction --> DiagramValidation
    DiagramValidation --> ServerConfiguration
    ServerConfiguration --> URLConstruction
    URLConstruction --> HTTPRequest
    HTTPRequest --> ResponseProcessing
    ResponseProcessing --> BinaryConversion
    BinaryConversion --> OutputGeneration
    OutputGeneration --> [*]
    
    DiagramValidation --> ErrorHandling : Empty Diagram Source
    ServerConfiguration --> ErrorHandling : Invalid Custom URL
    HTTPRequest --> ErrorHandling : Request Timeout/Failure
    ResponseProcessing --> ErrorHandling : Invalid Response
    BinaryConversion --> ErrorHandling : Conversion Error
    
    ErrorHandling --> ContinueOnFail : continueOnFail enabled
    ErrorHandling --> WorkflowFailure : continueOnFail disabled
    
    ContinueOnFail --> OutputGeneration
    WorkflowFailure --> [*]
```

**Sequence Diagram: Interactions between systems to enable Feature**

The sequence diagram illustrates the interaction between the n8n workflow engine, the Kroki node, Kroki API service, and binary data processing components.

```mermaid
---
title: Kroki Diagram Conversion Sequence
---
sequenceDiagram
    participant WF as n8n Workflow Engine
    participant KN as Kroki Node
    participant PH as Parameter Handler
    participant RB as Request Builder
    participant KA as Kroki API Service
    participant RP as Response Processor
    participant BD as Binary Data Handler
    
    WF->>KN: execute() with input data
    KN->>PH: getNodeParameter('diagramType', 'outputFormat', 'diagramSource')
    PH-->>KN: diagram parameters
    
    KN->>KN: validate diagram source not empty
    KN->>KN: validate custom server URL if applicable
    
    KN->>RB: construct HTTP request
    RB->>RB: build URL: {server}/{type}/{format}
    RB->>RB: set headers: Content-Type text/plain
    RB->>RB: set timeout configuration
    RB-->>KN: HTTP request configuration
    
    KN->>KA: POST diagram source to API endpoint
    KA->>KA: process diagram conversion
    KA-->>KN: binary response (PNG/PDF) or text (SVG)
    
    KN->>RP: process API response
    RP->>RP: determine response type (Buffer/String)
    RP->>BD: convert to base64 encoding
    BD->>BD: create IBinaryData object
    BD->>BD: set MIME type and filename
    BD-->>RP: n8n binary data object
    
    alt Processing Error
        KN->>KN: check continueOnFail()
        alt Continue on Fail
            KN-->>WF: error item with original data
        else Fail Workflow
            KN-->>WF: throw NodeOperationError
        end
    end
    
    RP-->>KN: binary data with metadata
    KN-->>WF: return processed items with binary data
```

**Data Entity Relationship: Data structure for entities in Feature**

The entity relationship diagram shows the data structures involved in the Kroki diagram conversion processing.

```mermaid
---
title: Kroki Node Data Structures
---
erDiagram
    INodeExecutionData {
        json Object
        binary Object
        pairedItem Number
        error Error
    }
    
    KrokiInputData {
        diagramType String
        outputFormat String
        diagramSource String
        krokiServer String
        customServerUrl String
        options Object
    }
    
    KrokiOptions {
        timeout Number
        binaryPropertyName String
    }
    
    IBinaryData {
        data String
        mimeType String
        fileName String
        fileExtension String
    }
    
    KrokiOutputData {
        diagramType String
        outputFormat String
        fileName String
        mimeType String
        success Boolean
        bodyType String
        bodyConstructor String
        bodyLength Number
        isBuffer Boolean
        url String
        debug Object
    }
    
    HTTPRequest {
        method String
        url String
        body String
        headers Object
        timeout Number
        encoding Null
    }
    
    KrokiAPIResponse {
        statusCode Number
        headers Object
        body Buffer_or_String
    }
    
    INodeExecutionData ||--|| KrokiInputData : "contains input"
    KrokiInputData ||--|| KrokiOptions : "includes options"
    INodeExecutionData ||--|| IBinaryData : "outputs binary"
    INodeExecutionData ||--|| KrokiOutputData : "outputs json"
    KrokiInputData ||--|| HTTPRequest : "builds request"
    HTTPRequest ||--|| KrokiAPIResponse : "receives response"
    KrokiAPIResponse ||--|| IBinaryData : "converts to binary"
```
## USE-CASE: Custom Server Configuration and Validation

**Feature 1: Flexible Kroki Server Deployment Support**

|| definition |
|--|--|
| GIVEN | A user needs to use a custom Kroki server deployment instead of the public service |
| WHEN | The Kroki node is configured with custom server option and validated URL |
| THEN | The node successfully connects to the custom server and processes diagram conversions |

**State Diagram: Logic flow within feature**

The state diagram shows the server configuration validation and connection process.

```mermaid
---
title: Custom Server Configuration State Flow
---
stateDiagram-v2
    [*] --> ServerSelection
    ServerSelection --> PublicService : Public Option Selected
    ServerSelection --> CustomService : Custom Option Selected
    
    PublicService --> URLConfiguration : Use kroki.io
    CustomService --> URLInput : User Provides URL
    
    URLInput --> URLValidation
    URLValidation --> ConnectionTest
    ConnectionTest --> ServerReady
    ServerReady --> [*]
    
    URLValidation --> ValidationError : Invalid URL Format
    ConnectionTest --> ConnectionError : Server Unreachable
    
    ValidationError --> URLInput
    ConnectionError --> URLInput
    
    URLConfiguration --> ServerReady
```

**Sequence Diagram: Interactions between systems to enable Feature**

The sequence diagram illustrates the custom server configuration and validation process.

```mermaid
---
title: Custom Server Configuration Sequence
---
sequenceDiagram
    participant User as User Interface
    participant KN as Kroki Node
    participant Val as URL Validator
    participant CS as Custom Server
    participant PS as Public Service
    
    User->>KN: select server option
    
    alt Custom Server Selected
        User->>KN: provide custom server URL
        KN->>Val: validate URL format
        Val-->>KN: validation result
        
        alt Valid URL
            KN->>CS: test connection
            CS-->>KN: server response
            KN-->>User: server configured successfully
        else Invalid URL
            KN-->>User: URL format error
        end
    else Public Service Selected
        KN->>PS: configure default service
        PS-->>KN: service ready
        KN-->>User: using public service
    end
```

**Data Entity Relationship: Data structure for entities in Feature**

The entity relationship diagram shows the server configuration data structures.

```mermaid
---
title: Server Configuration Data Structures
---
erDiagram
    ServerConfiguration {
        serverType String
        baseURL String
        customURL String
        isValidated Boolean
        connectionStatus String
    }
    
    URLValidation {
        url String
        protocol String
        hostname String
        isValid Boolean
        errorMessage String
    }
    
    APIEndpoint {
        baseURL String
        diagramType String
        outputFormat String
        fullURL String
    }
    
    ConnectionTest {
        serverURL String
        testDiagram String
        responseStatus Number
        responseTime Number
        isSuccessful Boolean
    }
    
    ServerConfiguration ||--|| URLValidation : "validates"
    ServerConfiguration ||--|| APIEndpoint : "builds"
    URLValidation ||--|| ConnectionTest : "enables"
    APIEndpoint ||--|| ConnectionTest : "tests"
```

## USE-CASE: Binary Data Processing and Format Handling

**Feature 1: Multi-format Binary Output with MIME Type Management**

|| definition |
|--|--|
| GIVEN | A Kroki API returns diagram data in PNG, SVG, or PDF format |
| WHEN | The response processor handles the binary/text data and converts it for n8n storage |
| THEN | The data is properly encoded, stored with correct MIME type, and made available as workflow binary data |

**State Diagram: Logic flow within feature**

The state diagram shows the binary data processing pipeline from API response to n8n binary storage.

```mermaid
---
title: Binary Data Processing State Flow
---
stateDiagram-v2
    [*] --> ResponseReceived
    ResponseReceived --> FormatDetection
    FormatDetection --> PNGProcessing : PNG Format
    FormatDetection --> SVGProcessing : SVG Format  
    FormatDetection --> PDFProcessing : PDF Format
    
    PNGProcessing --> BufferHandling
    PDFProcessing --> BufferHandling
    SVGProcessing --> StringHandling
    
    BufferHandling --> Base64Encoding
    StringHandling --> UTF8ToBase64
    
    Base64Encoding --> MIMETypeMapping
    UTF8ToBase64 --> MIMETypeMapping
    
    MIMETypeMapping --> BinaryDataCreation
    BinaryDataCreation --> WorkflowStorage
    WorkflowStorage --> [*]
    
    FormatDetection --> ProcessingError : Unknown Format
    BufferHandling --> EncodingError : Buffer Error
    StringHandling --> EncodingError : String Error
    
    ProcessingError --> ErrorHandling
    EncodingError --> ErrorHandling
    ErrorHandling --> [*]
```

**Sequence Diagram: Interactions between systems to enable Feature**

The sequence diagram illustrates the binary data processing workflow.

```mermaid
---
title: Binary Data Processing Sequence
---
sequenceDiagram
    participant KA as Kroki API
    participant RP as Response Processor
    participant FD as Format Detector
    participant BE as Base64 Encoder
    participant MT as MIME Type Mapper
    participant BD as Binary Data Creator
    participant WF as Workflow Storage
    
    KA->>RP: HTTP response with diagram data
    RP->>FD: determine response format
    FD-->>RP: format type (PNG/SVG/PDF)
    
    alt PNG or PDF (Binary)
        RP->>BE: encode buffer to base64
        BE-->>RP: base64 string
    else SVG (Text)
        RP->>BE: convert string to base64
        BE-->>RP: base64 string
    end
    
    RP->>MT: map format to MIME type
    MT-->>RP: MIME type string
    
    RP->>BD: create IBinaryData object
    BD->>BD: set data, mimeType, fileName, extension
    BD-->>RP: binary data object
    
    RP->>WF: store binary data with metadata
    WF-->>RP: storage confirmation
```

**Data Entity Relationship: Data structure for entities in Feature**

The entity relationship diagram shows the binary data processing structures.

```mermaid
---
title: Binary Data Processing Data Structures
---
erDiagram
    KrokiAPIResponse {
        body Buffer_or_String
        headers Object
        statusCode Number
        contentType String
    }
    
    FormatDetection {
        outputFormat String
        dataType String
        isBuffer Boolean
        contentLength Number
    }
    
    EncodingProcess {
        originalData Buffer_or_String
        base64Data String
        encodingType String
        success Boolean
    }
    
    MIMETypeMapping {
        outputFormat String
        mimeType String
        fileExtension String
        isText Boolean
    }
    
    IBinaryData {
        data String
        mimeType String
        fileName String
        fileExtension String
        fileSize Number
    }
    
    WorkflowBinaryData {
        propertyName String
        binaryData IBinaryData
        metadata Object
    }
    
    KrokiAPIResponse ||--|| FormatDetection : "analyzes"
    FormatDetection ||--|| EncodingProcess : "determines"
    EncodingProcess ||--|| MIMETypeMapping : "maps to"
    MIMETypeMapping ||--|| IBinaryData : "creates"
    IBinaryData ||--|| WorkflowBinaryData : "stores as"
```

## USE-CASE: Error Handling and Workflow Resilience

**Feature 1: Comprehensive Error Management with Continue-on-Fail Support**

|| definition |
|--|--|
| GIVEN | A workflow encounters errors during diagram conversion (invalid syntax, server issues, etc.) |
| WHEN | The error handling system processes the error based on continueOnFail configuration |
| THEN | The workflow either stops with detailed error information or continues with error data preserved |

**State Diagram: Logic flow within feature**

The state diagram shows the error handling decision process and recovery mechanisms.

```mermaid
---
title: Error Handling and Recovery State Flow
---
stateDiagram-v2
    [*] --> OperationExecution
    OperationExecution --> SuccessfulCompletion : No Errors
    OperationExecution --> ErrorDetection : Error Occurred
    
    ErrorDetection --> ErrorClassification
    ErrorClassification --> ValidationError : Parameter/Input Error
    ErrorClassification --> NetworkError : Connection/Timeout Error  
    ErrorClassification --> APIError : Kroki Service Error
    ErrorClassification --> ProcessingError : Data Processing Error
    
    ValidationError --> ContinueOnFailCheck
    NetworkError --> ContinueOnFailCheck
    APIError --> ContinueOnFailCheck
    ProcessingError --> ContinueOnFailCheck
    
    ContinueOnFailCheck --> ErrorRecovery : Continue Enabled
    ContinueOnFailCheck --> WorkflowTermination : Continue Disabled
    
    ErrorRecovery --> ErrorDataCreation
    ErrorDataCreation --> WorkflowContinuation
    WorkflowContinuation --> [*]
    
    WorkflowTermination --> [*]
    SuccessfulCompletion --> [*]
```

**Sequence Diagram: Interactions between systems to enable Feature**

The sequence diagram illustrates the error handling workflow across system components.

```mermaid
---
title: Error Handling and Recovery Sequence
---
sequenceDiagram
    participant WF as Workflow Engine
    participant KN as Kroki Node
    participant EH as Error Handler
    participant EC as Error Classifier
    participant CF as Continue-on-Fail Logic
    participant ER as Error Recovery
    
    WF->>KN: execute workflow step
    KN->>KN: process diagram conversion
    
    alt Error Occurs
        KN->>EH: handle caught exception
        EH->>EC: classify error type
        EC-->>EH: error classification
        
        EH->>CF: check continueOnFail setting
        CF-->>EH: continue preference
        
        alt Continue on Fail Enabled
            EH->>ER: create error data item
            ER->>ER: preserve original input data
            ER->>ER: add error metadata
            ER-->>KN: error item with context
            KN-->>WF: return error item in results
        else Continue on Fail Disabled
            EH->>EH: create NodeOperationError
            EH-->>WF: throw workflow termination error
        end
    else Successful Execution
        KN-->>WF: return successful results
    end
```

**Data Entity Relationship: Data structure for entities in Feature**

The entity relationship diagram shows the error handling data structures and relationships.

```mermaid
---
title: Error Handling Data Structures
---
erDiagram
    NodeOperationError {
        message String
        description String
        context Object
        itemIndex Number
        cause Error
    }
    
    ErrorClassification {
        errorType String
        severity String
        isRecoverable Boolean
        suggestedAction String
    }
    
    ContinueOnFailConfig {
        enabled Boolean
        preserveInputData Boolean
        includeErrorDetails Boolean
    }
    
    ErrorDataItem {
        json Object
        error String
        success Boolean
        originalData Object
        errorContext Object
        pairedItem Number
    }
    
    WorkflowContext {
        itemIndex Number
        totalItems Number
        currentNode String
        workflowId String
    }
    
    ErrorRecovery {
        errorItem ErrorDataItem
        recoveryStrategy String
        dataPreservation Boolean
        continueExecution Boolean
    }
    
    NodeOperationError ||--|| ErrorClassification : "classified as"
    ErrorClassification ||--|| ContinueOnFailConfig : "processed by"
    ContinueOnFailConfig ||--|| ErrorRecovery : "determines"
    ErrorRecovery ||--|| ErrorDataItem : "creates"
    WorkflowContext ||--|| ErrorDataItem : "provides context"
```
````
    
    Build->>Prettier: format code files
    Prettier-->>Build: formatted code
    
    Build->>Pub: prepare for publication
    Pub->>ESLint: run pre-publish validation
    ESLint-->>Pub: final validation result
    
    alt Pre-publish Validation Passed
        Pub-->>Dev: ready for npm publish
    else Pre-publish Validation Failed
        Pub-->>Dev: publication blocked
    end
```

**Data Entity Relationship: Data structure for entities in Feature**

The entity relationship diagram shows the code quality configuration and validation structures.

```mermaid
---
title: Code Quality Assurance Data Structures
---
erDiagram
    ESLintConfig {
        root Boolean
        env Object
        parser String
        parserOptions Object
        ignorePatterns Array
        overrides Array
    }
    
    N8nRules {
        name String
        severity String
        category String
        description String
        fixable Boolean
    }
    
    PrettierConfig {
        semi Boolean
        trailingComma String
        bracketSpacing Boolean
        useTabs Boolean
        tabWidth Number
        singleQuote Boolean
        printWidth Number
    }
    
    ValidationResult {
        filePath String
        errorCount Number
        warningCount Number
        messages Array
        fixable Boolean
    }
    
    FormattingResult {
        filePath String
        formatted Boolean
        changes Array
        styleIssues Array
    }
    
    QualityReport {
        totalFiles Number
        passedFiles Number
        failedFiles Number
        errorCount Number
        warningCount Number
        fixableErrors Number
    }
    
    ESLintConfig ||--o{ N8nRules : "defines"
    ESLintConfig ||--|| ValidationResult : "generates"
    PrettierConfig ||--|| FormattingResult : "generates"
    ValidationResult ||--o{ QualityReport : "aggregates to"
    FormattingResult ||--o{ QualityReport : "aggregates to"
```
