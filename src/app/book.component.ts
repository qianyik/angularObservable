import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/Observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/retry';
import { HttpErrorResponse } from '@angular/common/http';
import { BookService } from './book.service';
import { Book } from './book';

@Component({
   selector: 'app-book',
   templateUrl: './book.component.html'
})
export class BookComponent implements OnInit { 
   allBooks$: Observable<Book[]>;
   favBook$: Observable<Book>;
   myAllfavBooks$: Observable<Book[]>;
   favBookName$: Observable<string>; 
   similarBooks$: Observable<Book[]>; 
   softBooks: Book[];
   allFavBooks: Book[];
   bookName: string | {};
   similarFavBooks: Book[];

   constructor(private bookService: BookService) { }
   
   ngOnInit() {
        this.getBooks();	
        this.getFavBook();
        this.getsoftBooks();
        this.getAllFavBooks();
        this.getBookName();
   }
   getBooks() {
        this.allBooks$ = this.bookService.getBooksFromStore();
   }
   getFavBook() {
        this.favBook$ = this.bookService.getFavBookFromStore(101); 
   }
   getsoftBooks() {
        this.bookService.getBooksFromStore().retry(3).subscribe(books => {
           this.softBooks = books
        },
        (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
                //A client-side or network error occurred.
                console.log('An error occurred:', err.error.message);
            } else {
                //Backend returns unsuccessful response codes such as 404, 500 etc.
                console.log('Backend returned status code: ', err.status);
                console.log('Response body:', err.error);
            }
         }
        );
   }
   getAllFavBooks() {
        this.myAllfavBooks$ = this.bookService.getFavBookFromStore(101)
            .mergeMap(book => this.bookService.getBooksByCategoryFromStore(book.category));

        // Using subscribe
        this.bookService.getFavBookFromStore(101).mergeMap(book => { 
             let category = book.category;
             return this.bookService.getBooksByCategoryFromStore(category);
        }).subscribe(books => {
             this.allFavBooks = books;
        });
   }   
   getBookName() {
        this.favBookName$ = this.bookService.getFavBookFromStore(101).map(book=> book.name);  

        // Using subscribe
        this.bookService.getFavBookFromStore(101)
          .map(book=> {
            if(book.name.length < 15) {
               return book.name;
            } else {
               throw('Length less than 15');
            }
          })
          .catch(error => {
            console.log(error);
            //return of("Default Name");
            throw(error.message || error);
          })
          .subscribe(name=> {
              this.bookName = name;
              console.log(name);
            },
            err => {
              console.log(err);
            }
          );
   }
   searchSimilarBooks(id: number) {
        this.similarBooks$ = this.bookService.getFavBookFromStore(id)
            .switchMap(book => {
                let category = book.category;
                return this.bookService.getBooksByCategoryFromStore(category);
            })
            .catch(err => of([]));

        // Using subscribe
        this.bookService.getFavBookFromStore(id)
            .switchMap(book => {
                let category = book.category;
                return this.bookService.getBooksByCategoryFromStore(category);
            })
            .catch(err => of([]))
            .subscribe(books => {
                this.similarFavBooks = books;
                console.log(books);
            });
   }
}