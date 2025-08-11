# Contributing to VLD

Thank you for your interest in contributing to VLD! We welcome contributions from the community.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/ersinkoc/vld.git
   cd vld
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Ensure all tests pass before submitting
- Add tests for new features
- Maintain 100% test coverage

### Commit Messages

Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions or changes
- `perf:` Performance improvements
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Add/update tests as needed
4. Update documentation if applicable
5. Ensure all tests pass
6. Submit a pull request with a clear description

### Testing

- Write unit tests for all new functionality
- Ensure performance benchmarks still pass
- Test TypeScript type inference
- Verify bundle size remains under 8KB

### Performance

VLD prioritizes performance. When contributing:
- Run benchmarks before and after changes
- Ensure no performance regression
- Optimize hot paths
- Minimize allocations

## Areas for Contribution

- Additional schema types
- Performance optimizations
- Documentation improvements
- Bug fixes
- Plugin development
- Internationalization
- Testing improvements

## Questions?

Feel free to open an issue for discussion or join our Discord community.

## License

By contributing to VLD, you agree that your contributions will be licensed under the MIT License.