import { joinPath } from "./utils";
import { wrapNextOrObserver, sanitiseObject } from "./utils";

test("joinPath", async () => {
  const abc = joinPath("a", "b", "c");
  expect(abc).toBe("a/b/c");

  const abc2 = joinPath("a/", "/b/", "/c/");
  expect(abc2).toBe("a/b/c");

  const a = joinPath("a");
  expect(a).toBe("a");

  const empty = joinPath("");
  expect(empty).toBe("");
});

test("joinPath", async () => {
  const abc = joinPath("a", "b", "c");
  expect(abc).toBe("a/b/c");

  const abc2 = joinPath("a/", "/b/", "/c/");
  expect(abc2).toBe("a/b/c");

  const a = joinPath("a");
  expect(a).toBe("a");

  const empty = joinPath("");
  expect(empty).toBe("");
});

test("wrapNextOrObserver - object", () => {
  const current = {
    next: jest.fn(),
    error: jest.fn(),
    complete: jest.fn(),
  };

  const wrapper = (t: string) => t.toUpperCase();

  const wrapped = wrapNextOrObserver(current, wrapper);

  typeof wrapped == "object" ? wrapped.next("hello") : wrapped("hello");

  expect(current.next).toHaveBeenCalledWith("HELLO");

  typeof wrapped == "object" ? wrapped.next(null) : wrapped(null);

  expect(current.next).toHaveBeenCalledWith(null);
});

test("wrapNextOrObserver - function", () => {
  const current = jest.fn();

  const wrapper = (t: string) => t.toUpperCase();

  const wrapped = wrapNextOrObserver(current, wrapper);

  typeof wrapped == "object" ? wrapped.next("hello") : wrapped("hello");

  expect(current).toHaveBeenCalledWith("HELLO");

  typeof wrapped == "object" ? wrapped.next(null) : wrapped(null);

  expect(current).toHaveBeenCalledWith(null);
});

test("sanitiseObject", () => {
  const data = {
    name: "John",
    age: 25,
    createdAt: new Date(),
  };

  const sanitisingFunction = (field: string, value: unknown) => {
    if (field === "createdAt" && value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  const sanitised = sanitiseObject(data, sanitisingFunction);

  expect(sanitised.name).toBe("John");
  expect(sanitised.age).toBe(25);
  expect(typeof sanitised.createdAt).toBe("string");
});
