# n8n-nodes-kroki Architecture

This document contains the architectural design of the n8n-nodes-kroki solution with the focus on the high level components and how they interact. The architecture follows the n8n community node package structure with TypeScript-based Kroki diagram conversion, external API integration, and build automation.

## High-level Component definitions & use

Describes the definitions and use of each component in the design, its technology and the scope of the use of any services.

**System components**

**Kroki Node Implementation Layer**

The Kroki Node Implementation Layer consists of the TypeScript class that implements the INodeType interface, providing diagram conversion functionality from text-based sources to binary image formats using the Kroki API service.

**Core Functionality: Kroki Node Implementation Layer**

- **Diagram Type Selection**: Supports 22+ diagram types including Mermaid, PlantUML, GraphViz, D2, DBML, Excalidraw, and specialized formats
- **Format Conversion**: Converts diagrams to PNG, SVG, or PDF formats with appropriate MIME type handling
- **Server Configuration**: Supports both public Kroki service (kroki.io) and custom Kroki server deployments
- **Binary Data Processing**: Handles HTTP response conversion to n8n binary data format with base64 encoding

**Architecture Diagram of component: Kroki Node Implementation Layer**

```mermaid
---
title: Kroki Node Implementation Architecture
---
flowchart TD
    WorkflowInput["Workflow Input Data"] --> KrokiNode["Kroki Node Class"]
    KrokiNode --> ParameterExtraction["Parameter Extraction"]
    
    ParameterExtraction --> DiagramType["Diagram Type Selection"]
    ParameterExtraction --> OutputFormat["Output Format (PNG/SVG/PDF)"]
    ParameterExtraction --> DiagramSource["Diagram Source Code"]
    ParameterExtraction --> ServerConfig["Server Configuration"]
    
    ServerConfig --> PublicServer["Public Kroki Service (kroki.io)"]
    ServerConfig --> CustomServer["Custom Kroki Server"]
    
    DiagramType --> RequestBuilder["HTTP Request Builder"]
    OutputFormat --> RequestBuilder
    DiagramSource --> RequestBuilder
    PublicServer --> RequestBuilder
    CustomServer --> RequestBuilder
    
    RequestBuilder --> KrokiAPI["Kroki API Endpoint"]
    KrokiAPI --> ResponseProcessor["Response Processor"]
    
    ResponseProcessor --> MimeTypeHandler["MIME Type Handler"]
    ResponseProcessor --> BinaryConverter["Binary Data Converter"]
    
    MimeTypeHandler --> BinaryData["n8n Binary Data"]
    BinaryConverter --> BinaryData
    
    BinaryData --> WorkflowOutput["Workflow Output Data"]
    
    ErrorHandling["Error Handling & Validation"] --> ResponseProcessor
    ErrorHandling --> ContinueOnFail["Continue on Fail Logic"]
```

**HTTP Request Processing System**

The HTTP Request Processing System manages the communication with Kroki API services, handling request formatting, timeout management, and response processing for diagram conversion operations.

**Core Functionality: HTTP Request Processing System**

- **Request Construction**: Builds HTTP POST requests with diagram source as plain text body to Kroki API endpoints
- **Server Management**: Supports both public Kroki service and custom server deployments with URL validation
- **Timeout Handling**: Configurable timeout settings (1-300 seconds) for large diagram processing operations
- **Response Processing**: Handles binary response data (PNG/PDF) and text responses (SVG) with appropriate encoding

**Architecture Diagram of component: HTTP Request Processing System**

```mermaid
---
title: HTTP Request Processing System Architecture
---
flowchart TD
    DiagramInput["Diagram Source Text"] --> RequestFormatter["HTTP Request Formatter"]
    ServerSelection["Server Selection Logic"] --> URLBuilder["URL Builder"]
    
    URLBuilder --> PublicURL["https://kroki.io/{type}/{format}"]
    URLBuilder --> CustomURL["Custom Server URL/{type}/{format}"]
    
    RequestFormatter --> HTTPHeaders["HTTP Headers (Content-Type: text/plain)"]
    RequestFormatter --> RequestBody["Request Body (Diagram Source)"]
    
    HTTPHeaders --> HTTPClient["n8n HTTP Client"]
    RequestBody --> HTTPClient
    PublicURL --> HTTPClient
    CustomURL --> HTTPClient
    TimeoutConfig["Timeout Configuration"] --> HTTPClient
    
    HTTPClient --> KrokiService["Kroki Service API"]
    KrokiService --> ResponseHandler["Response Handler"]
    
    ResponseHandler --> BinaryResponse["Binary Response (PNG/PDF)"]
    ResponseHandler --> TextResponse["Text Response (SVG)"]
    
    BinaryResponse --> BufferProcessor["Buffer Processor"]
    TextResponse --> StringProcessor["String Processor"]
    
    BufferProcessor --> Base64Encoder["Base64 Encoder"]
    StringProcessor --> Base64Encoder
    
    Base64Encoder --> BinaryData["n8n Binary Data Object"]
```

**Build and Distribution System**

The Build and Distribution System manages the compilation of TypeScript source code, asset copying, and npm package preparation for the Kroki node distribution. It uses TypeScript compiler, Gulp for asset management, and npm for package publishing.

**Core Functionality: Build and Distribution System**

- **TypeScript Compilation**: Compiles Kroki node TypeScript source to JavaScript ES2019 with strict type checking
- **Asset Management**: Copies kroki.svg icon file from source to distribution directory using Gulp
- **Package Preparation**: Prepares npm package structure with compiled Kroki node and metadata
- **Quality Assurance**: Runs ESLint validation and Prettier formatting with n8n-specific rules before publication

**Architecture Diagram of component: Build and Distribution System**

```mermaid
---
title: Build and Distribution System Architecture  
---
flowchart TD
    KrokiSource["Kroki.node.ts Source"] --> TypeScriptCompiler["TypeScript Compiler"]
    KrokiIcon["kroki.svg Icon"] --> GulpBuild["Gulp Build System"]
    
    TypeScriptCompiler --> CompiledKroki["Compiled Kroki.node.js"]
    GulpBuild --> CopiedIcon["Copied kroki.svg Asset"]
    
    CompiledKroki --> DistDirectory["dist/nodes/Kroki/ Directory"]
    CopiedIcon --> DistDirectory
    
    DistDirectory --> PackagePrep["Package Preparation"]
    PackageMetadata["package.json (Kroki node registration)"] --> PackagePrep
    IndexFile["index.js Entry Point"] --> PackagePrep
    
    PackagePrep --> QualityCheck["ESLint & Prettier Validation"]
    QualityCheck --> NPMPublish["NPM Package Publication"]
    
    NPMPublish --> CommunityRegistry["n8n Community Registry"]
    
    BuildScript["npm run build"] --> TypeScriptCompiler
    BuildScript --> GulpBuild
    DeployScript["build-and-deploy.sh"] --> BuildScript
```
    IconAssets["SVG/PNG Icon Assets"] --> GulpBuild["Gulp Build System"]
    
    TypeScriptCompiler --> CompiledJS["Compiled JavaScript (ES2019)"]
    GulpBuild --> CopiedAssets["Copied Icon Assets"]
    
    CompiledJS --> DistDirectory["dist/ Directory"]
    CopiedAssets --> DistDirectory
    
    DistDirectory --> PackagePrep["Package Preparation"]
    PackageMetadata["package.json Metadata"] --> PackagePrep
    
    PackagePrep --> QualityCheck["ESLint & Prettier Validation"]
    QualityCheck --> NPMPublish["NPM Package Publication"]
    
    NPMPublish --> CommunityRegistry["n8n Community Registry"]
```

**Diagram Type and Format Management System**

The Diagram Type and Format Management System provides the UI configuration, parameter validation, and format mapping for the extensive range of diagram types and output formats supported by the Kroki service.

**Core Functionality: Diagram Type and Format Management System**

- **Type Selection**: Provides dropdown selection for 22+ diagram types with descriptions (Mermaid, PlantUML, GraphViz, etc.)
- **Format Mapping**: Maps output formats (PNG, SVG, PDF) to appropriate MIME types and file extensions
- **Parameter Validation**: Validates diagram source code, server URLs, and configuration options
- **Dynamic UI**: Provides conditional display logic for custom server configuration options

**Architecture Diagram of component: Diagram Type and Format Management System**

```mermaid
---
title: Diagram Type and Format Management System Architecture
---
flowchart TD
    UserInterface["n8n Node UI"] --> TypeSelector["Diagram Type Selector"]
    UserInterface --> FormatSelector["Output Format Selector"]
    UserInterface --> SourceEditor["Diagram Source Editor"]
    UserInterface --> ServerSelector["Server Selector"]
    
    TypeSelector --> DiagramTypes["22+ Diagram Types"]
    DiagramTypes --> Mermaid["Mermaid (Flowcharts, Sequence)"]
    DiagramTypes --> PlantUML["PlantUML (UML Diagrams)"]
    DiagramTypes --> GraphViz["GraphViz (Network Diagrams)"]
    DiagramTypes --> Specialized["Specialized Types (D2, DBML, etc.)"]
    
    FormatSelector --> OutputFormats["Output Formats"]
    OutputFormats --> PNG["PNG (image/png)"]
    OutputFormats --> SVG["SVG (image/svg+xml)"]
    OutputFormats --> PDF["PDF (application/pdf)"]
    
    SourceEditor --> CodeValidation["Source Code Validation"]
    ServerSelector --> ServerConfig["Server Configuration"]
    
    ServerConfig --> PublicOption["Public Service Option"]
    ServerConfig --> CustomOption["Custom Server Option"]
    CustomOption --> URLValidation["Custom URL Validation"]
    
    CodeValidation --> ParameterProcessor["Parameter Processor"]
    URLValidation --> ParameterProcessor
    PNG --> MimeTypeMapper["MIME Type Mapper"]
    SVG --> MimeTypeMapper
    PDF --> MimeTypeMapper
    
    ParameterProcessor --> RequestBuilder["HTTP Request Builder"]
    MimeTypeMapper --> ResponseHandler["Response Handler"]
```

**Testing and Development Environment System**

The Testing and Development Environment System provides Docker-based local testing capabilities for the Kroki node integration with n8n, including containerized n8n instance with PostgreSQL backend for comprehensive testing.

**Core Functionality: Testing and Development Environment System**

- **Docker Environment**: Provides containerized n8n instance with PostgreSQL database for local testing
- **Service Orchestration**: Uses Docker Compose to manage n8n and database services with proper networking
- **Environment Configuration**: Manages environment variables for n8n configuration and database connection
- **Local Testing**: Enables testing of Kroki node integration without external dependencies

**Architecture Diagram of component: Testing and Development Environment System**

```mermaid
---
title: Testing and Development Environment System Architecture
---
flowchart TD
    DevEnvironment["Development Environment"] --> DockerCompose["Docker Compose Configuration"]
    DockerCompose --> N8nContainer["n8n Container"]
    DockerCompose --> PostgresContainer["PostgreSQL Container"]
    
    N8nContainer --> N8nConfig["n8n Configuration (.n8n.env)"]
    PostgresContainer --> PostgresConfig["PostgreSQL Configuration (.pg.env)"]
    
    N8nConfig --> N8nWebUI["n8n Web Interface (Port 5678)"]
    PostgresConfig --> DatabaseService["Database Service (Port 5432)"]
    
    LocalMount["Local Mount Directory"] --> TestFiles["Test Diagram Files"]
    LocalMount --> OutputFiles["Generated Image Files"]
    
    KrokiNodeDist["Compiled Kroki Node"] --> N8nContainer
    TestFiles --> WorkflowTesting["Workflow Testing"]
    
    N8nWebUI --> WorkflowEditor["Workflow Editor"]
    WorkflowEditor --> KrokiNodeTesting["Kroki Node Testing"]
    KrokiNodeTesting --> DiagramConversion["Live Diagram Conversion"]
    
    DiagramConversion --> OutputFiles
    DatabaseService --> WorkflowStorage["Workflow Storage"]
    
    LoggingSystem["Container Logging"] --> N8nContainer
    LoggingSystem --> PostgresContainer
    DebugOutput["Debug Output"] --> LoggingSystem
```
