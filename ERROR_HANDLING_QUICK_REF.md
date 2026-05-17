# Error Handling Quick Reference Card

## 🚀 One-Minute Overview

**What**: Converted GearGuard error handling from generic messages to comprehensive, categorized errors with development/production awareness.

**Impact**: All API errors now include type, detailed context, timestamps, and security-safe production responses.

**Status**: ✅ Core system complete. 2/9 controllers converted. Ready for contributors to apply pattern.

---

## 📋 The 4-Step Pattern

### 1️⃣ Add Imports

```javascript
const {
  ErrorHandler,
  ERROR_TYPES,
  asyncHandler,
} = require("../utils/errorHandler");
```

### 2️⃣ Wrap Functions

```javascript
exports.myFunction = asyncHandler(async (req, res, next) => {
  // function body
});
```

### 3️⃣ Throw Errors

```javascript
throw new ErrorHandler("Invalid input", ERROR_TYPES.VALIDATION_ERROR);
```

### 4️⃣ Success Responses

```javascript
res.status(200).json({ success: true, message: "Done", data: result });
```

---

## 🎯 Error Types at a Glance

```
VALIDATION_ERROR      → 400 (missing/invalid fields)
AUTHENTICATION_ERROR  → 401 (login failed, expired token)
AUTHORIZATION_ERROR   → 403 (permission denied)
NOT_FOUND_ERROR       → 404 (resource doesn't exist)
DUPLICATE_ERROR       → 409 (email/item already exists)
DATABASE_ERROR        → 500 (DB connection failed)
SERVER_ERROR          → 500 (unexpected error)
```

---

## 📁 Key Files

| File                                     | Purpose                 |
| ---------------------------------------- | ----------------------- |
| `server/utils/errorHandler.js`           | Error utilities & types |
| `server/middleware/errorHandler.js`      | Global middleware       |
| `server/docs/ERROR_HANDLING.md`          | Full guide & reference  |
| `server/docs/ERROR_HANDLING_EXAMPLES.js` | 5 code patterns         |
| `authController.js`                      | ✅ Complete example     |
| `equipmentController.js`                 | ✅ Complete example     |

---

## 🧪 Testing

**Development Mode** (detailed errors):

```bash
NODE_ENV=development npm run dev
```

**Production Mode** (generic errors):

```bash
NODE_ENV=production npm run dev
```

---

## 💡 Common Patterns

### Validation Error

```javascript
if (!email || !password) {
  throw new ErrorHandler(
    "Email and password are required.",
    ERROR_TYPES.VALIDATION_ERROR,
  );
}
```

### Not Found

```javascript
const user = await User.findById(id);
if (!user) {
  throw new ErrorHandler("User not found", ERROR_TYPES.NOT_FOUND_ERROR);
}
```

### Authorization

```javascript
if (req.user.role !== "Admin") {
  throw new ErrorHandler(
    "Only admins can perform this action.",
    ERROR_TYPES.AUTHORIZATION_ERROR,
  );
}
```

### Duplicate Entry

```javascript
const existing = await User.findOne({ email });
if (existing) {
  throw new ErrorHandler(
    "Email already registered.",
    ERROR_TYPES.DUPLICATE_ERROR,
  );
}
```

---

## 📊 Response Examples

### Error (Development)

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Email is required",
    "timestamp": "2026-05-17T18:35:00Z",
    "details": {
      "stack": "Error: ...",
      "validationErrors": [{ "field": "email", "message": "required" }]
    }
  }
}
```

### Error (Production)

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid request. Please check your input.",
    "timestamp": "2026-05-17T18:35:00Z"
  }
}
```

### Success

```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": "123", "email": "user@example.com" }
}
```

---

## ✅ Conversion Checklist

- [ ] Added imports
- [ ] All functions wrapped with `asyncHandler`
- [ ] Replaced error returns with `throw new ErrorHandler()`
- [ ] Added `success: true` to responses
- [ ] Tested in development mode (detailed errors)
- [ ] Tested in production mode (generic errors)
- [ ] No `try-catch` blocks (handled by asyncHandler)
- [ ] Commits ready for PR

---

## 🎓 Learning Resources

1. **Quick Start**: This card (you're reading it!)
2. **Full Guide**: `server/docs/ERROR_HANDLING.md`
3. **Code Examples**: `server/docs/ERROR_HANDLING_EXAMPLES.js`
4. **Working Models**: authController.js, equipmentController.js
5. **Test Guide**: `TESTING_ERROR_HANDLING.md`

---

## 📞 Getting Help

**Q: What error type should I use?**
A: See "Error Types at a Glance" section above or check ERROR_HANDLING.md table

**Q: How do I test my changes?**
A: See TESTING_ERROR_HANDLING.md or use cURL examples

**Q: Can I copy the pattern from authController?**
A: Yes! Both authController and equipmentController are complete examples

**Q: What if I need a custom error message?**
A: Create ErrorHandler with custom message - it supports any text

---

## ⏱️ Time Commitment

- **First conversion**: 30-45 min (learning pattern)
- **Each subsequent**: 15-20 min (familiar pattern)
- **Testing each**: 5-10 min
- **All remaining**: ~3-4 hours total

---

## 🎯 Controllers Remaining

| Controller                | Status   | Priority |
| ------------------------- | -------- | -------- |
| requestController.js      | ⏳ Ready | High     |
| teamController.js         | ⏳ Ready | High     |
| memberController.js       | ⏳ Ready | High     |
| adminController.js        | ⏳ Ready | Medium   |
| notificationController.js | ⏳ Ready | Medium   |
| searchController.js       | ⏳ Ready | Low      |
| predictiveController.js   | ⏳ Ready | Low      |

**Pick any one and start!** Pattern is identical for all.

---

## 🔗 Important Links

- **Documentation**: `server/docs/ERROR_HANDLING.md`
- **Examples**: `server/docs/ERROR_HANDLING_EXAMPLES.js`
- **Test Guide**: `TESTING_ERROR_HANDLING.md`
- **Complete Guide**: `ERROR_HANDLING_COMPLETE_GUIDE.md`
- **Issue Template**: `.github/ISSUE_TEMPLATE/convert-controller.md`

---

## 🎯 NSoC 2026 Ready ✅

This system is:

- ✅ **Complete** - Core fully functional
- ✅ **Documented** - Multiple guides provided
- ✅ **Simple** - Clear 4-step pattern
- ✅ **Tested** - Working examples included
- ✅ **Ready** - No additional learning needed

**Perfect for first-time OSS contributors!**

---

**Quick Tip**: When in doubt, copy the pattern from authController.js and adapt it to your controller. The pattern is identical!

**Last Updated**: May 17, 2026  
**Status**: ✅ Production Ready  
**Next Step**: Pick a controller and start converting!
