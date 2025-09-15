# Python Package Management

!!! note

    This guide covers the evolution from traditional tools to modern next-generation solutions, helping you choose the right tool for your workflow.

## Key Areas

-   Package version Management
-   Python version Management
-   Environment management
-   Package building
-   Package publishing

## Concepts

-   `pyproject.toml`: Standard configuration file defined in [PEP 518](https://peps.python.org/pep-0518/) for Python projects

    -   Replaces traditional `setup.py`, `setup.cfg`, and `requirements.txt`
    -   Used by modern build tools like Poetry, PDM, Hatch
    -   Contains project metadata, dependencies, build requirements, dev dependencies
    -   Example structure:

        ```toml
        [build-system]
        requires = ["setuptools>=42", "wheel"]
        build-backend = "setuptools.build_meta"

        [project]
        name = "my-package"
        version = "0.1.0"
        description = "A sample Python project"
        readme = "README.md"
        authors = [
            {name = "Example Author", email = "author@example.com"}
        ]
        requires-python = ">=3.8"
        dependencies = [
            "numpy>=1.20.0",
            "pandas>=1.3.0",
        ]

        [project.optional-dependencies]
        dev = [
            "pytest>=6.0.0",
            "black>=22.0.0",
        ]

        [tool.pytest.ini_options]
        testpaths = ["tests"]

        [tool.black]
        line-length = 88
        ```

-   `Pipfile`: TOML-based dependency specification file used by pipenv

    -   Replaces `requirements.txt` with a more structured format
    -   Contains `[packages]` section for runtime dependencies and `[dev-packages]` for development dependencies
    -   Supports version constraints and source specifications
    -   Paired with `Pipfile.lock` for reproducible builds
    -   Example:

        ```toml
        [[source]]
        url = "https://pypi.org/simple"
        verify_ssl = true
        name = "pypi"

        [packages]
        requests = "*"
        flask = ">=2.0"

        [dev-packages]
        pytest = "*"
        black = "*"

        [requires]
        python_version = "3.8"
        ```

-   `wheel` vs `sdist`:

    -   **Wheel (.whl)**: Pre-built distribution format that doesn't require compilation during installation
        -   Faster installation, especially for packages with C extensions
        -   Platform-specific (may need different wheels for different OSs/architectures)
        -   Defined in [PEP 427](https://peps.python.org/pep-0427/)
    -   **Source Distribution (sdist)**: Contains source code and build instructions
        -   More portable but may require compilation during installation
        -   Contains `setup.py` or `pyproject.toml` plus source files

-   **Dependency Resolution**:

    -   **Pinned requirements**: Exact versions (`package==1.2.3`)
    -   **Compatible release**: Allows patch updates (`package~=1.2.0` means ≥1.2.0, <1.3.0)
    -   **Version ranges**: Flexible constraints (`package>=1.0,<2.0`)
    -   **Lock files**: `poetry.lock`, `Pipfile.lock`, etc. - ensure reproducible installations

-   **Editable installs** (`pip install -e .`):

    -   Installs package in "development mode"
    -   Changes to source code immediately reflected without reinstalling
    -   Essential for library development workflows

-   **Virtual environments**:

    -   Isolated Python environments to avoid dependency conflicts
    -   Each project can have its own dependencies without affecting system Python
    -   Tools: `venv` (standard library), `virtualenv`, `conda`, `poetry`, etc.

-   **Package Metadata**:
    -   **Entry points**: Define console scripts and plugin hooks
    -   **Classifiers**: Standardized tags for categorizing packages on PyPI
    -   **Package discovery**: How to find modules to include (e.g., `find_packages()`)
    -   **Python version compatibility**: Specify supported Python versions

## Tools

### Traditional

-   `pip`: Standard package installer for Python

    -   Installs packages from PyPI or local files
    -   Basic commands: `pip install`, `pip uninstall`, `pip list`, `pip freeze`
    -   Supports requirements files: `pip install -r requirements.txt`
    -   Can install from git: `pip install git+https://github.com/user/repo.git`
    -   Limitations: No dependency resolution, no virtual environment management

-   `venv`: Built-in virtual environment tool (Python 3.3+)

    -   Creates isolated Python environments: `python -m venv myenv`
    -   Activate with: `source myenv/bin/activate` (Unix) or `myenv\Scripts\activate` (Windows)
    -   Deactivate with: `deactivate`
    -   Lightweight and part of standard library

-   [`virtualenv`](https://virtualenv.pypa.io/): Third-party virtual environment tool (predecessor to venv)

    -   More feature-rich than venv (can copy system packages, etc.)
    -   Can create environments with different Python versions
    -   Still useful for older Python versions or advanced use cases

-   `setuptools`: Traditional packaging library

    -   Provides `setup.py` for package configuration
    -   Includes `easy_install` (deprecated) and `pkg_resources`
    -   Used with `python setup.py install` or `pip install .`
    -   Being replaced by modern standards but still widely used

-   `wheel`: Binary package format for faster installations
    -   Build wheels with: `python -m pip wheel .` or `python setup.py bdist_wheel`
    -   Platform-specific (.whl files)
    -   Much faster than installing from source, especially for packages with C extensions

### Conda-like

-   `conda`

    -   Cross-platform package manager and environment manager
    -   Manages both Python and non-Python dependencies
    -   Uses channels (defaults, conda-forge, etc.) for package distribution
    -   Creates isolated environments with `conda create -n myenv python=3.9`
    -   `miniconda`: Minimal installer for conda (includes conda + Python + essential packages)

-   `mamba` C++ reimplementation of `conda`

    -   Faster dependency resolution and installation
    -   Drop-in replacement for conda commands
    -   `micromamba`: Lightweight, standalone version of mamba (no base environment)

-   `pixi` Conda-like ([Compatibility docs](https://pixi.sh/latest/switching_from/conda/#troubleshooting)), Rust-based
    -   Fast, modern alternative to conda
    -   Uses `pixi.toml` for project configuration
    -   Supports conda, PyPI, and local package sources
    -   Built-in task runner and environment management

### Environment

-   `pip-tools`: Enhanced pip workflow with lock files

    -   `pip-compile` generates `requirements.txt` from `requirements.in`
    -   Ensures consistent, reproducible installations across environments
    -   Supports nested requirements and version constraints

-   `pipenv`: Combines pip + virtualenv functionality

    -   Generates `Pipfile` (declarative) and `Pipfile.lock` (exact versions)
    -   Automatically manages virtual environments
    -   Security features: checks for known vulnerabilities

-   `hatch`: Modern project management tool

    -   Environment management with isolated workspaces
    -   Build system with support for multiple formats
    -   Publishing to PyPI with metadata validation
    -   Plugin system for extensibility

-   `rye`: Rust-based tool for Python project management

    -   Fast dependency resolution and installation
    -   Built-in Python version management
    -   Project scaffolding and environment isolation

-   `tox`: Testing automation across multiple environments
    -   Runs tests in isolated virtual environments
    -   Supports multiple Python versions and dependency sets
    -   Integrates with CI/CD pipelines for comprehensive testing

### Next-gen

-   `poetry`: Comprehensive dependency management and packaging

    -   Advanced dependency resolver with proper conflict resolution
    -   Built-in virtual environment management
    -   Declarative configuration with `pyproject.toml`
    -   Lock file (`poetry.lock`) for reproducible builds
    -   Publishing workflow with version management
    -   Popular in production environments

-   `pdm`: Modern package and dependency manager

    -   Uses PEP 582 for local package installation (like `node_modules`)
    -   Fast dependency resolver written in Rust
    -   Supports both PEP 517/518 and legacy `setup.py`
    -   Flexible plugin system
    -   Cross-platform with good Windows support

-   `uv`: Ultra-fast Python package installer and resolver
    -   Rust-based implementation for speed (10-100x faster than pip)
    -   Drop-in replacement for pip, venv, and poetry workflows
    -   Global dependency cache for instant installs
    -   Built-in virtual environment management
    -   Supports all standard Python packaging formats

## Recommended Workflow (2024+)

For consistency and modern Python development, we recommend this single toolchain:

### Core Tools

-   **`uv`**: Ultra-fast package installer and virtual environment manager
-   **`pyproject.toml`**: Standard project configuration
-   **`hatch`**: Project management, building, and publishing
-   **`ruff`**: Fast Python linter and formatter
-   **`pytest`**: Testing framework

### Step-by-Step

**1. Project Setup:**

```bash
# Create project directory and initialize
mkdir myproject && cd myproject
uv init

# Create virtual environment
uv venv

# Activate environment
source .venv/bin/activate  # Unix
# or .venv\Scripts\activate  # Windows
```

**2. Configure `pyproject.toml`:**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "myproject"
version = "0.1.0"
description = "My Python project"
readme = "README.md"
requires-python = ">=3.8"
dependencies = [
    "requests>=2.25.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "ruff>=0.1.0",
]

[tool.ruff]
line-length = 88
target-version = "py38"

[tool.pytest.ini_options]
testpaths = ["tests"]
```

**3. Development Workflow:**

```bash
# Install dependencies
uv sync

# Add runtime dependency
uv add requests

# Add development dependency
uv add --dev pytest ruff

# Run linter and formatter
uv run ruff check .
uv run ruff format .

# Run tests
uv run pytest
```

**4. Building and Publishing:**

```bash
# Build package
hatch build

# Publish to Test PyPI first
hatch publish --repo test

# Publish to PyPI
hatch publish
```

**5. Version Management:**

```bash
# Bump version
hatch version patch  # 0.1.0 -> 0.1.1
hatch version minor  # 0.1.1 -> 0.2.0
hatch version major  # 0.2.0 -> 1.0.0
```

### Migration from Existing Environments

**From pip/virtualenv projects:**

1. **Backup your current environment:**

    ```bash
    pip freeze > requirements.txt.backup
    ```

2. **Create new uv project:**

    ```bash
    uv init
    uv venv
    source .venv/bin/activate
    ```

3. **Migrate dependencies:**

    ```bash
    # If you have requirements.txt
    uv add -r requirements.txt

    # Or add packages manually
    uv add requests flask django
    ```

4. **Update your pyproject.toml** with the configuration shown above

5. **Test and remove old files:**
    ```bash
    uv run python -c "import your_package"
    rm requirements.txt  # optional
    ```

**From Poetry projects:**

1. **Export current dependencies:**

    ```bash
    poetry export -f requirements.txt --output requirements.txt
    ```

2. **Initialize new uv project:**

    ```bash
    uv init
    uv venv
    source .venv/bin/activate
    ```

3. **Import dependencies:**

    ```bash
    uv add -r requirements.txt
    ```

4. **Copy source code and tests** from your Poetry project

5. **Update pyproject.toml** with Poetry's project metadata

6. **Test the migration:**
    ```bash
    uv sync
    uv run pytest
    ```

**From Conda environments:**

1. **Export conda environment:**

    ```bash
    conda env export > environment.yml
    ```

2. **For Python-only projects:**

    ```bash
    uv init
    uv venv
    source .venv/bin/activate
    # Manually add Python packages from environment.yml
    uv add numpy pandas scikit-learn
    ```

3. **For mixed Python/non-Python projects:**

    - Keep using conda for non-Python dependencies
    - Use uv within conda environment for Python packages:

    ```bash
    conda create -n myenv python=3.9 numpy scipy
    conda activate myenv
    uv init  # within the conda env
    uv add requests flask  # additional Python packages
    ```

4. **Test the setup:**
    ```bash
    uv run python -c "import sys; print('Python path:', sys.executable)"
    ```

**General Migration Tips:**

-   Start with a fresh directory for the new project
-   Test thoroughly before deleting old environments
-   Update CI/CD pipelines to use new commands
-   Inform team members about the migration
-   Consider using `uv run` instead of activating environments in scripts

This consistent workflow eliminates tool choice fatigue while providing modern, fast, and reliable Python package management.
